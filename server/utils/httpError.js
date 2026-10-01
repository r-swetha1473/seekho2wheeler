/**
 * HTTP-aware error for controllers. Login must never surface a generic 500.
 */
class AppError extends Error {
  constructor(message, status = 500, publicMessage) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.publicMessage = publicMessage || message;
  }
}

function publicSheetsMessage(err) {
  const msg = String((err && err.message) || err || '');
  if (/Requested entity was not found/i.test(msg)) {
    return 'Google Sheet was not found. Check GOOGLE_SHEETS_ID and share the spreadsheet with the service account as Editor.';
  }
  if (/Unable to parse range/i.test(msg)) {
    return 'A required sheet tab is missing. Retry login — the server will create it if credentials allow.';
  }
  if (/invalid_grant|DECODER|unsupported|ERR_OSSL/i.test(msg)) {
    return 'Google credentials are invalid. Check the service account JSON configured on the server.';
  }
  if (/PERMISSION|does not have permission|forbidden/i.test(msg)) {
    return 'The service account cannot access the spreadsheet. Share it as Editor with the service account email.';
  }
  if (/Google Sheets is not configured/i.test(msg)) {
    return 'Google Sheets is not configured. Set GOOGLE_SHEETS_ID and service account credentials.';
  }
  if (/quota|rate limit|too many requests|userRateLimitExceeded/i.test(msg) || Number(err && (err.code || err.status)) === 429) {
    return 'Google Sheets is busy (rate limit). Wait a few seconds and refresh the page.';
  }
  return 'Unable to reach Google Sheets. Please try again shortly.';
}

function isMissingTabError(err) {
  const msg = String((err && err.message) || '');
  const code = Number(err && (err.code || err.status));
  return code === 400 || /Unable to parse range/i.test(msg);
}

module.exports = { AppError, publicSheetsMessage, isMissingTabError };
