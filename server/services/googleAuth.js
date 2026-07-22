/**
 * Google authentication for Sheets / Drive.
 *
 * Mode A — GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY
 * Mode B — credentials/service-account.json (local / Windows)
 * Mode C — GOOGLE_SERVICE_ACCOUNT_JSON (best for Vercel: paste whole JSON as one env var)
 *
 * Automatically tries modes in a reliable order and falls back on OpenSSL failures.
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

  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  key = key
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  if (key.includes('\\\\n')) {
    key = key.replace(/\\\\n/g, '\n');
  }

  key = key
    .replace(/-----BEGIN ([A-Z0-9 ]+)-----/g, '-----BEGIN $1-----\n')
    .replace(/\n?-----END ([A-Z0-9 ]+)-----/g, '\n-----END $1-----\n');

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

/**
 * Parse GOOGLE_SERVICE_ACCOUNT_JSON (raw JSON or base64).
 * Best option for Vercel — one env var, no PEM escaping issues.
 */
function parseServiceAccountJsonEnv(raw) {
  if (!raw) return null;
  let text = String(raw).trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    try {
      const decoded = Buffer.from(text, 'base64').toString('utf8');
      parsed = JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  if (!parsed || !parsed.client_email || !parsed.private_key) return null;

  return {
    ...parsed,
    private_key: normalizePrivateKey(parsed.private_key)
  };
}

function getJsonEnvCredentials() {
  return parseServiceAccountJsonEnv(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_CREDENTIALS_JSON || ''
  );
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

async function authFromCredentials(credentials, method, debug) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: normalizePrivateKey(credentials.private_key)
    },
    scopes: SCOPES
  });
  const client = await auth.getClient();
  await client.getAccessToken();
  if (debug) console.log(`[auth] ✓ ${method} succeeded`);
  return {
    auth: client,
    method,
    keyFile: null,
    clientEmail: credentials.client_email
  };
}

/**
 * Create an authenticated Google auth client.
 */
async function createGoogleAuth(options = {}) {
  const debug = options.debug !== false;
  const keyFile = findKeyFile();
  const jsonCreds = getJsonEnvCredentials();
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || (jsonCreds && jsonCreds.client_email) || '';
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = normalizePrivateKey(rawKey);
  const diag = keyDiagnostics('env', privateKey);

  if (debug) {
    printAuthReport({
      'Key file found': keyFile || '(none)',
      'JSON env set': Boolean(jsonCreds),
      'Env email set': Boolean(email),
      'Env key length': diag.length,
      'Env key BEGIN': diag.startsWithBegin,
      'Env key END': diag.endsWithEnd,
      'Env key placeholder': diag.looksPlaceholder
    });
  }

  // Mode C — full JSON in env (Vercel-friendly)
  if (jsonCreds) {
    try {
      if (debug) console.log('[auth] Trying Mode C: GOOGLE_SERVICE_ACCOUNT_JSON');
      return await authFromCredentials(jsonCreds, 'json-env', debug);
    } catch (err) {
      console.error('[auth] Mode C (JSON env) failed:', err.message);
      if (debug && err.stack) console.error(err.stack);
    }
  }

  // Mode B — key file (local)
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
    }
  }

  // Mode A — email + private key env vars
  if (email && privateKey && diag.startsWithBegin && diag.endsWithEnd && !diag.looksPlaceholder) {
    try {
      if (debug) console.log('[auth] Trying Mode A: env email + private key');
      return await authFromCredentials(
        { client_email: email, private_key: privateKey },
        'env',
        debug
      );
    } catch (err) {
      console.error('[auth] Mode A (env) failed:', err.message);
      if (/DECODER|unsupported|ERR_OSSL|private key/i.test(err.message + (err.stack || ''))) {
        console.error(
          '[auth] PEM decode failed. On Vercel, set GOOGLE_SERVICE_ACCOUNT_JSON to the full service-account JSON instead.'
        );
      }
      if (debug && err.stack) console.error(err.stack);
      throw err;
    }
  }

  if (diag.looksPlaceholder) {
    throw new Error(
      'GOOGLE_PRIVATE_KEY is a placeholder. On Vercel set GOOGLE_SERVICE_ACCOUNT_JSON to your full service-account JSON.'
    );
  }

  throw new Error(
    'No usable Google credentials.\n' +
      'Provide one of:\n' +
      '  C) GOOGLE_SERVICE_ACCOUNT_JSON  (recommended on Vercel)\n' +
      '  B) credentials/service-account.json  (local)\n' +
      '  A) GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY'
  );
}

function credentialsAvailable() {
  if (getJsonEnvCredentials()) return true;
  if (findKeyFile()) return true;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY || '');
  const diag = keyDiagnostics('check', privateKey);
  return Boolean(email && privateKey && diag.startsWithBegin && diag.endsWithEnd && !diag.looksPlaceholder);
}

/** Safe diagnostics for /api/health (no secrets). */
function credentialStatus() {
  const jsonCreds = getJsonEnvCredentials();
  const keyFile = findKeyFile();
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY || '');
  const diag = keyDiagnostics('status', privateKey);
  const missing = [];

  if (!process.env.GOOGLE_SHEETS_ID) missing.push('GOOGLE_SHEETS_ID');
  if (!jsonCreds && !keyFile) {
    if (!email) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    if (!diag.startsWithBegin || !diag.endsWithEnd) missing.push('GOOGLE_PRIVATE_KEY (or GOOGLE_SERVICE_ACCOUNT_JSON)');
    else if (diag.looksPlaceholder) missing.push('GOOGLE_PRIVATE_KEY is still a placeholder');
  }

  let hint = 'ok';
  if (missing.length) {
    hint =
      'On Vercel: add GOOGLE_SERVICE_ACCOUNT_JSON = contents of credentials/service-account.json (one line JSON).';
  }

  return {
    hasSpreadsheetId: Boolean(process.env.GOOGLE_SHEETS_ID),
    hasKeyFile: Boolean(keyFile),
    hasJsonEnv: Boolean(jsonCreds),
    hasEmail: Boolean(email || (jsonCreds && jsonCreds.client_email)),
    hasPrivateKey: Boolean(diag.startsWithBegin && diag.endsWithEnd && !diag.looksPlaceholder) || Boolean(jsonCreds),
    privateKeyLength: diag.length,
    missing,
    hint
  };
}

module.exports = {
  SCOPES,
  DEFAULT_KEY_FILE,
  normalizePrivateKey,
  keyDiagnostics,
  findKeyFile,
  createGoogleAuth,
  credentialsAvailable,
  credentialStatus,
  parseServiceAccountJsonEnv,
  getJsonEnvCredentials,
  printAuthReport,
  loadKeyFileJson
};
