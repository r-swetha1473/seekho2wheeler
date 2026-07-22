/**
 * Initialize Google Spreadsheet tabs + optional seed sync.
 *
 * Usage:
 *   node scripts/init-sheets.js
 *   node scripts/init-sheets.js --seed
 *
 * Auth (either mode):
 *   Mode B (recommended on Windows / Node 22):
 *     credentials/service-account.json
 *   Mode A:
 *     GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY in .env
 *
 * Share the spreadsheet with the service account email (Editor).
 */
require('dotenv').config();

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const config = require('../server/config');
const { SHEET_HEADERS } = require('../server/services/db');
const {
  createGoogleAuth,
  printAuthReport,
  findKeyFile,
  keyDiagnostics,
  normalizePrivateKey
} = require('../server/services/googleAuth');

const TABS = Object.keys(SHEET_HEADERS);
const SEED_DIR = path.join(__dirname, '../server/seed-defaults');
const doSeed = process.argv.includes('--seed');

function serialize(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function explainOpenSslError(err) {
  const msg = String(err && err.message ? err.message : err);
  if (!/DECODER|unsupported|ERR_OSSL|error:1E08010C/i.test(msg)) return null;
  return [
    '',
    'OpenSSL decoder error detected (common on Node.js 17+ / Windows).',
    'Cause: GOOGLE_PRIVATE_KEY in .env is invalid, placeholder, or badly escaped.',
    'Fix (recommended):',
    '  1. Download the service account JSON from Google Cloud Console',
    '  2. Save it as: credentials/service-account.json',
    '  3. Share the spreadsheet with the service account client_email (Editor)',
    '  4. Re-run: npm run init-sheets -- --seed',
    'Alternative: paste the real private_key PEM into GOOGLE_PRIVATE_KEY (keep \\n escapes).'
  ].join('\n');
}

async function main() {
  const report = {
    nodeVersion: process.version,
    openssl: process.versions.openssl || 'n/a',
    googleapis: require('../package.json').dependencies.googleapis,
    authMethod: '(not started)',
    clientEmail: config.sheets.clientEmail || '(unknown)',
    spreadsheetId: config.sheets.spreadsheetId || '(missing)',
    spreadsheetAccess: 'FAIL',
    sheetWriteStatus: 'FAIL',
    tabsCreated: [],
    headersWritten: [],
    seededTabs: []
  };

  console.log('Seekho · Google Sheets initializer');
  console.log('Spreadsheet ID:', report.spreadsheetId || '(missing)');
  console.log('Key file candidate:', findKeyFile() || '(none found)');

  const envDiag = keyDiagnostics('env', normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY || ''));
  if (envDiag.looksPlaceholder) {
    console.warn(
      '\n⚠ GOOGLE_PRIVATE_KEY looks like a placeholder (YOUR_NEW_PRIVATE_KEY_CONTENT).\n' +
        '  Env Mode A will be skipped. Place credentials/service-account.json for Mode B.\n'
    );
  }

  if (!config.sheets.enabled) {
    console.error('GOOGLE_SHEETS_ENABLED is not true.');
    process.exit(1);
  }
  if (!config.sheets.spreadsheetId) {
    console.error('GOOGLE_SHEETS_ID is missing.');
    process.exit(1);
  }
  if (!config.sheets.ready) {
    console.error('Google Sheets credentials are incomplete.');
    console.error('Add credentials/service-account.json OR a real GOOGLE_PRIVATE_KEY.');
    printAuthReport(report);
    process.exit(1);
  }

  let authResult;
  try {
    authResult = await createGoogleAuth({ debug: true });
  } catch (err) {
    console.error('\nAuth initialization failed:', err.message);
    const tip = explainOpenSslError(err);
    if (tip) console.error(tip);
    if (err.stack) console.error('\nStack:\n', err.stack);
    report.authMethod = 'FAILED';
    printAuthReport(report);
    process.exit(1);
  }

  report.authMethod = authResult.method;
  report.clientEmail = authResult.clientEmail;
  console.log('Auth method used:', authResult.method);
  console.log('Service account:', authResult.clientEmail);

  const api = google.sheets({ version: 'v4', auth: authResult.auth });

  let meta;
  try {
    meta = await api.spreadsheets.get({ spreadsheetId: config.sheets.spreadsheetId });
    report.spreadsheetAccess = 'OK';
    console.log('✓ Spreadsheet access OK —', meta.data.properties?.title || '(untitled)');
  } catch (err) {
    console.error('✗ Spreadsheet access failed:', err.message);
    console.error(
      '  Share the sheet with',
      authResult.clientEmail,
      'as Editor:\n  https://docs.google.com/spreadsheets/d/' + config.sheets.spreadsheetId
    );
    if (err.stack) console.error(err.stack);
    printAuthReport(report);
    process.exit(1);
  }

  const existing = new Set((meta.data.sheets || []).map((s) => s.properties.title));
  console.log('Existing tabs:', [...existing].join(', ') || '(none)');

  const requests = [];
  TABS.forEach((title) => {
    if (!existing.has(title)) {
      requests.push({ addSheet: { properties: { title } } });
    }
  });

  try {
    if (requests.length) {
      await api.spreadsheets.batchUpdate({
        spreadsheetId: config.sheets.spreadsheetId,
        requestBody: { requests }
      });
      report.tabsCreated = requests.map((r) => r.addSheet.properties.title);
      console.log('✓ Created tabs:', report.tabsCreated.join(', '));
    } else {
      console.log('✓ All required tabs already exist.');
    }

    for (const tab of TABS) {
      const headers = SHEET_HEADERS[tab];
      const current = await api.spreadsheets.values.get({
        spreadsheetId: config.sheets.spreadsheetId,
        range: `${tab}!A1:Z1`
      });
      const hasHeader = (current.data.values || []).length > 0;

      if (!hasHeader) {
        await api.spreadsheets.values.update({
          spreadsheetId: config.sheets.spreadsheetId,
          range: `${tab}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [headers] }
        });
        report.headersWritten.push(tab);
        console.log(`✓ headers → ${tab}`);
      }

      if (doSeed) {
        const seedFile = path.join(SEED_DIR, `${tab}.json`);
        if (!fs.existsSync(seedFile)) continue;
        const rows = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
        if (!Array.isArray(rows) || !rows.length) continue;
        if (tab === 'bookings' || tab === 'enquiries') continue;

        const values = [headers, ...rows.map((r) => headers.map((h) => serialize(r[h])))];
        await api.spreadsheets.values.clear({
          spreadsheetId: config.sheets.spreadsheetId,
          range: `${tab}!A:Z`
        });
        await api.spreadsheets.values.update({
          spreadsheetId: config.sheets.spreadsheetId,
          range: `${tab}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values }
        });
        report.seededTabs.push(`${tab}(${rows.length})`);
        console.log(`✓ seeded ${rows.length} row(s) → ${tab}`);
      }
    }

    report.sheetWriteStatus = 'OK';
  } catch (err) {
    console.error('✗ Sheet write failed:', err.message);
    const tip = explainOpenSslError(err);
    if (tip) console.error(tip);
    if (err.stack) console.error(err.stack);
    printAuthReport(report);
    process.exit(1);
  }

  printAuthReport({
    'Auth method': report.authMethod,
    'Service account': report.clientEmail,
    'Spreadsheet ID': report.spreadsheetId,
    'Spreadsheet access': report.spreadsheetAccess,
    'Sheet write status': report.sheetWriteStatus,
    'Tabs created': report.tabsCreated.join(', ') || '(none)',
    'Headers written': report.headersWritten.join(', ') || '(already present)',
    'Seeded tabs': report.seededTabs.join(', ') || (doSeed ? '(none)' : '(skipped — pass --seed)')
  });

  console.log('Done. Google Sheets is ready as primary storage.');
  if (!doSeed) {
    console.log('Tip: run with --seed once to push website content from server/seed-defaults.');
  }
}

main().catch((err) => {
  console.error('init-sheets failed:', err.message);
  const tip = explainOpenSslError(err);
  if (tip) console.error(tip);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
