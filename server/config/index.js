require('dotenv').config();

const path = require('path');
const fs = require('fs');

/**
 * Normalize spreadsheet ID from URL or raw ID.
 * Ensure GOOGLE_SHEETS_ENABLED + credentials drive Sheets mode.
 */
function parseSpreadsheetId(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  const fromUrl = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (fromUrl) return fromUrl[1];
  return value;
}

const sheetsEnabled = process.env.GOOGLE_SHEETS_ENABLED === 'true';
const spreadsheetId = parseSpreadsheetId(process.env.GOOGLE_SHEETS_ID);
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (sheetsEnabled && (!spreadsheetId || !clientEmail || !privateKey)) {
  console.warn(
    '[config] GOOGLE_SHEETS_ENABLED=true but credentials are incomplete. ' +
      'Set GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY.'
  );
}

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'seekho_dev_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@seekhoacademy.com',
    password: process.env.ADMIN_PASSWORD || 'Seekho@Admin2026'
  },
  sheets: {
    enabled: sheetsEnabled,
    spreadsheetId,
    clientEmail,
    privateKey,
    /** True when Sheets is fully usable as primary DB */
    ready: Boolean(sheetsEnabled && spreadsheetId && clientEmail && privateKey)
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    notifyEmail: process.env.NOTIFY_EMAIL || ''
  },
  contact: {
    phones: ['9748481630', '7980108587', '7980110273'],
    whatsapp: process.env.WHATSAPP_NUMBER || '9748481630'
  },
  uploads: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  }
};
