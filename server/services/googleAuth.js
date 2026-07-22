/**
 * Google authentication for Sheets / Drive.
 *
 * Mode A — Environment variables (email + private key)
 * Mode B — credentials/service-account.json (preferred on Windows / Node 22)
 *
 * Automatically falls back to keyFile when env JWT fails (OpenSSL decoder errors).
 */
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive'
];

const DEFAULT_KEY_FILE = path.join(__dirname, '../../credentials/service-account.json');

/**
 * Normalize PEM private keys from .env (Windows / quoted / escaped newlines).
 */
function normalizePrivateKey(raw) {
  if (!raw) return '';
  let key = String(raw).trim();

  // Strip wrapping quotes: "..." or '...'
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  // Common .env escape forms
  key = key
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Some paste tools turn real newlines into literal "\n" twice
  if (key.includes('\\\\n')) {
    key = key.replace(/\\\\n/g, '\n');
  }

  // Ensure BEGIN/END markers have surrounding newlines
  key = key
    .replace(/-----BEGIN ([A-Z0-9 ]+)-----/g, '-----BEGIN $1-----\n')
    .replace(/\n?-----END ([A-Z0-9 ]+)-----/g, '\n-----END $1-----\n');

  // Collapse accidental blank line spam inside PEM
  key = key.replace(/\n{3,}/g, '\n\n').trim() + '\n';

  return key;
}

function keyDiagnostics(label, key) {
  const normalized = key || '';
  const startOk = normalized.includes('BEGIN PRIVATE KEY') || normalized.includes('BEGIN RSA PRIVATE KEY');
  const endOk = normalized.includes('END PRIVATE KEY') || normalized.includes('END RSA PRIVATE KEY');
  const looksPlaceholder = /YOUR_|REPLACE_|PRIVATE_KEY_CONTENT|xxx/i.test(normalized);
  return {
    label,
    length: normalized.length,
    startsWithBegin: startOk,
    endsWithEnd: endOk,
    hasLiteralBackslashN: String(key || '').includes('\\n') && !String(key || '').includes('\n-----'),
    looksPlaceholder,
    previewStart: normalized.slice(0, 40).replace(/\n/g, '\\n'),
    previewEnd: normalized.slice(-40).replace(/\n/g, '\\n')
  };
}

function resolveKeyFilePaths() {
  const fromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_SERVICE_ACCOUNT_FILE || '';
  const candidates = [
    fromEnv,
    DEFAULT_KEY_FILE,
    path.join(process.cwd(), 'credentials', 'service-account.json'),
    path.join(process.cwd(), 'service-account.json')
  ].filter(Boolean);

  return [...new Set(candidates.map((p) => path.resolve(p)))];
}

function findKeyFile() {
  for (const file of resolveKeyFilePaths()) {
    if (fs.existsSync(file)) return file;
  }
  return null;
}

function loadKeyFileJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(raw);
  if (!json.client_email || !json.private_key) {
    throw new Error(`Invalid service account JSON at ${filePath} (missing client_email/private_key)`);
  }
  return json;
}

function printAuthReport(extra = {}) {
  const pkg = require('../../package.json');
  const googleapisVer = (pkg.dependencies && pkg.dependencies.googleapis) || 'unknown';
  console.log('\n========== Google Auth Diagnostics ==========');
  console.log('Node version:     ', process.version);
  console.log('Platform:         ', process.platform, process.arch);
  console.log('OpenSSL:          ', process.versions.openssl || 'n/a');
  console.log('googleapis:       ', googleapisVer);
  Object.entries(extra).forEach(([k, v]) => {
    console.log(`${k}:`.padEnd(18), typeof v === 'object' ? JSON.stringify(v) : v);
  });
  console.log('==============================================\n');
}

/**
 * Create an authenticated Google auth client.
 * Prefers keyFile when present; otherwise env credentials.
 * If env JWT fails with decoder/OpenSSL errors, retries with keyFile.
 */
async function createGoogleAuth(options = {}) {
  const debug = options.debug !== false;
  const keyFile = findKeyFile();
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = normalizePrivateKey(rawKey);
  const diag = keyDiagnostics('env', privateKey);

  if (debug) {
    printAuthReport({
      'Key file found': keyFile || '(none)',
      'Env email set': Boolean(email),
      'Env key length': diag.length,
      'Env key BEGIN': diag.startsWithBegin,
      'Env key END': diag.endsWithEnd,
      'Env key placeholder': diag.looksPlaceholder,
      'Env key preview': `${diag.previewStart} ... ${diag.previewEnd}`
    });
  }

  if (diag.looksPlaceholder && !keyFile) {
    const err = new Error(
      'GOOGLE_PRIVATE_KEY is still a placeholder (YOUR_NEW_PRIVATE_KEY_CONTENT). ' +
        'Paste the real private_key from your service account JSON, or place the file at credentials/service-account.json'
    );
    err.code = 'PLACEHOLDER_KEY';
    throw err;
  }

  // Mode B first when file exists (most reliable on Node 22 / Windows)
  if (keyFile) {
    try {
      if (debug) console.log('[auth] Trying Mode B: GoogleAuth keyFile →', keyFile);
      const auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: SCOPES
      });
      const client = await auth.getClient();
      const json = loadKeyFileJson(keyFile);
      if (debug) console.log('[auth] ✓ Mode B succeeded (service-account.json)');
      return {
        auth: client,
        method: 'keyFile',
        keyFile,
        clientEmail: json.client_email
      };
    } catch (err) {
      console.error('[auth] Mode B (keyFile) failed:', err.message);
      if (debug && err.stack) console.error(err.stack);
      // fall through to env if available
    }
  }

  // Mode A — env credentials via GoogleAuth credentials object (preferred over legacy JWT ctor)
  if (email && privateKey && diag.startsWithBegin && diag.endsWithEnd && !diag.looksPlaceholder) {
    try {
      if (debug) console.log('[auth] Trying Mode A: GoogleAuth credentials (env private key)');
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: email,
          private_key: privateKey
        },
        scopes: SCOPES
      });
      const client = await auth.getClient();
      // Force token fetch to surface OpenSSL errors early
      await client.getAccessToken();
      if (debug) console.log('[auth] ✓ Mode A succeeded (env credentials)');
      return {
        auth: client,
        method: 'env',
        keyFile: null,
        clientEmail: email
      };
    } catch (err) {
      console.error('[auth] Mode A (env) failed:', err.message);
      if (/DECODER|unsupported|ERR_OSSL|private key/i.test(err.message + (err.stack || ''))) {
        console.error(
          '[auth] This usually means the PEM private key in .env is corrupted/escaped incorrectly.\n' +
            '       Fix: use credentials/service-account.json instead of GOOGLE_PRIVATE_KEY on Windows/Node 22.'
        );
      }
      if (debug && err.stack) console.error(err.stack);

      // Last resort: legacy JWT if keyFile appeared after env failure path
      if (keyFile) {
        if (debug) console.log('[auth] Retrying Mode B after Mode A failure…');
        const auth = new google.auth.GoogleAuth({ keyFile, scopes: SCOPES });
        const client = await auth.getClient();
        const json = loadKeyFileJson(keyFile);
        return {
          auth: client,
          method: 'keyFile-fallback',
          keyFile,
          clientEmail: json.client_email
        };
      }
      throw err;
    }
  }

  throw new Error(
    'No usable Google credentials.\n' +
      'Provide either:\n' +
      '  A) credentials/service-account.json  (recommended)\n' +
      '  B) GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY in .env'
  );
}

function credentialsAvailable() {
  const keyFile = findKeyFile();
  if (keyFile) return true;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY || '');
  const diag = keyDiagnostics('check', privateKey);
  return Boolean(email && privateKey && diag.startsWithBegin && diag.endsWithEnd && !diag.looksPlaceholder);
}

module.exports = {
  SCOPES,
  DEFAULT_KEY_FILE,
  normalizePrivateKey,
  keyDiagnostics,
  findKeyFile,
  createGoogleAuth,
  credentialsAvailable,
  printAuthReport,
  loadKeyFileJson
};
