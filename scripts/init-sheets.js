/**
 * Initialize Google Spreadsheet tabs + optional seed sync.
 *
 * Usage:
 *   node scripts/init-sheets.js
 *   node scripts/init-sheets.js --seed
 *
 * Requires in .env:
 *   GOOGLE_SHEETS_ENABLED=true
 *   GOOGLE_SHEETS_ID=...
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL=...
 *   GOOGLE_PRIVATE_KEY=...
 *
 * Share the spreadsheet with the service account email (Editor).
 */
require('dotenv').config();

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const config = require('../server/config');
const { SHEET_HEADERS, parseSpreadsheetId } = require('../server/services/db');

const TABS = Object.keys(SHEET_HEADERS);
const SEED_DIR = path.join(__dirname, '../server/seed-defaults');
const doSeed = process.argv.includes('--seed');

function serialize(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

async function main() {
  if (!config.sheets.ready) {
    console.error('Google Sheets is not fully configured.');
    console.error('Set GOOGLE_SHEETS_ENABLED=true and provide ID + service account email + private key.');
    process.exit(1);
  }

  const spreadsheetId = config.sheets.spreadsheetId;
  console.log('Spreadsheet ID:', spreadsheetId);
  console.log('Service account:', config.sheets.clientEmail);

  const auth = new google.auth.JWT(
    config.sheets.clientEmail,
    null,
    config.sheets.privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  const api = google.sheets({ version: 'v4', auth });

  const meta = await api.spreadsheets.get({ spreadsheetId });
  const existing = new Set((meta.data.sheets || []).map((s) => s.properties.title));
  console.log('Existing tabs:', [...existing].join(', ') || '(none)');

  const requests = [];
  TABS.forEach((title) => {
    if (!existing.has(title)) {
      requests.push({ addSheet: { properties: { title } } });
    }
  });

  // Optional alias tab name "reviews" → we use testimonials internally
  if (!existing.has('testimonials') && !requests.some((r) => r.addSheet?.properties?.title === 'testimonials')) {
    // already handled in TABS
  }

  if (requests.length) {
    await api.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });
    console.log('Created tabs:', requests.map((r) => r.addSheet.properties.title).join(', '));
  } else {
    console.log('All required tabs already exist.');
  }

  // Write headers for empty tabs; optionally seed content
  for (const tab of TABS) {
    const headers = SHEET_HEADERS[tab];
    const current = await api.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A1:Z1`
    });
    const hasHeader = (current.data.values || []).length > 0;

    if (!hasHeader) {
      await api.spreadsheets.values.update({
        spreadsheetId,
        range: `${tab}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] }
      });
      console.log(`✓ headers → ${tab}`);
    }

    if (doSeed) {
      const seedFile = path.join(SEED_DIR, `${tab}.json`);
      if (!fs.existsSync(seedFile)) continue;
      const rows = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
      if (!Array.isArray(rows) || !rows.length) continue;

      // Skip overwriting bookings/enquiries with seed
      if (tab === 'bookings' || tab === 'enquiries') continue;

      const values = [headers, ...rows.map((r) => headers.map((h) => serialize(r[h])))];
      await api.spreadsheets.values.clear({ spreadsheetId, range: `${tab}!A:Z` });
      await api.spreadsheets.values.update({
        spreadsheetId,
        range: `${tab}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values }
      });
      console.log(`✓ seeded ${rows.length} row(s) → ${tab}`);
    }
  }

  console.log('\nDone. Google Sheets is ready as primary storage.');
  console.log('Tip: run with --seed once to push website content from server/seed-defaults.');
}

main().catch((err) => {
  console.error('init-sheets failed:', err.message);
  process.exit(1);
});
