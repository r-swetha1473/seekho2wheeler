/**
 * Print a one-line GOOGLE_SERVICE_ACCOUNT_JSON value for Vercel.
 * Usage: node scripts/print-vercel-sheets-env.js
 * Copies nothing remotely — prints to your terminal only.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../credentials/service-account.json');
if (!fs.existsSync(file)) {
  console.error('Missing credentials/service-account.json');
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(file, 'utf8'));
const oneLine = JSON.stringify(json);

console.log('\nAdd these in Vercel → Project → Settings → Environment Variables:\n');
console.log('GOOGLE_SHEETS_ENABLED=true');
console.log('GOOGLE_SHEETS_ID=1muxLXxr3iCNtj5-phkJjma1v8ymng7Bw9lHrTlx5kCk');
console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL=' + json.client_email);
console.log('\nGOOGLE_SERVICE_ACCOUNT_JSON=');
console.log(oneLine);
console.log('\nThen Redeploy. /api/health should show sheetsReady:true\n');
