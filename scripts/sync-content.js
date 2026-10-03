/**
 * Idempotent content sync for Google Sheets (Phase 2+).
 *
 * Upserts by id / slug / key. Never deletes unrelated Sheet rows.
 * Safe to run repeatedly.
 *
 * Usage:
 *   node scripts/sync-content.js
 *   npm run sync-content
 *
 * Required environment variables:
 *   GOOGLE_SHEETS_ENABLED=true
 *   GOOGLE_SHEETS_ID=<spreadsheet id or URL>
 *   Plus ONE of:
 *     C) GOOGLE_SERVICE_ACCOUNT_JSON   (recommended on Vercel)
 *     B) credentials/service-account.json
 *     A) GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY
 *
 * Optional:
 *   BASE_URL=https://seekho2wheeler.vercel.app
 *   GOOGLE_MAPS_EMBED_KEY=<Maps Embed API key for place-mode embeds>
 *
 * What this syncs (Phase 2):
 *   - settings: official social URLs, Main Branch address, GMB maps URL
 *     (only fills placeholders / missing fields; keeps custom Admin edits
 *      for non-placeholder socials)
 */
require('dotenv').config();

const config = require('../server/config');
const db = require('../server/services/db');
const {
  MAIN_BRANCH,
  OFFICIAL_SOCIAL,
  mapsSearchUrl,
  isPlaceholderSocial
} = require('../server/config/mainBranch');

function log(msg) {
  console.log(`[sync-content] ${msg}`);
}

/**
 * Merge settings: update official identity fields; replace placeholder socials only.
 */
function mergeSettings(existing) {
  const row = { ...(existing || {}) };
  const patch = {};

  const desiredAddress = MAIN_BRANCH.formattedAddress;
  if (!row.address || row.address === 'Multiple Branches Across Kolkata' || String(row.address).trim() === '') {
    patch.address = desiredAddress;
  }

  const desiredMaps = mapsSearchUrl(MAIN_BRANCH);
  if (!row.gmb_url || !String(row.gmb_url).includes(MAIN_BRANCH.placeId)) {
    patch.gmb_url = desiredMaps;
  }

  if (isPlaceholderSocial(row.facebookUrl, 'facebook')) {
    patch.facebookUrl = OFFICIAL_SOCIAL.facebookUrl;
  }
  if (isPlaceholderSocial(row.instagramUrl, 'instagram')) {
    patch.instagramUrl = OFFICIAL_SOCIAL.instagramUrl;
  }
  if (isPlaceholderSocial(row.youtubeUrl, 'youtube')) {
    patch.youtubeUrl = OFFICIAL_SOCIAL.youtubeUrl;
  }

  const phones = Array.isArray(row.phones)
    ? row.phones
    : String(row.phones || '').split(/[,|·]/).map((x) => x.trim()).filter(Boolean);
  const digits = phones.map((p) => String(p).replace(/\D/g, '')).filter(Boolean);
  const official = ['9748481630', '7980108587'];
  const cleaned = [...new Set(digits.filter((d) => official.includes(d)))];
  if (!cleaned.length || digits.includes('7980110273')) {
    patch.phones = official;
  }

  if (
    !row.trainedCandidates ||
    (/500\+/.test(String(row.trainedCandidates)) && !/5000/.test(String(row.trainedCandidates)))
  ) {
    patch.trainedCandidates = '5000+';
  }

  return { patch, next: { ...row, ...patch } };
}

/**
 * Generic upsert by primary key field (id or slug).
 * Never removes rows not in the payload.
 */
async function upsertByKey(sheet, keyField, records) {
  const existing = await db.getAll(sheet);
  const byKey = new Map(existing.map((r) => [String(r[keyField]), r]));
  let created = 0;
  let updated = 0;

  for (const rec of records) {
    const key = String(rec[keyField] || '');
    if (!key) {
      log(`skip ${sheet}: missing ${keyField}`);
      continue;
    }
    const prev = byKey.get(key);
    if (prev) {
      await db.update(sheet, prev.id, { ...rec, id: prev.id });
      updated += 1;
    } else {
      await db.create(sheet, rec);
      created += 1;
    }
  }

  return { created, updated, total: existing.length };
}

async function syncSettings() {
  const rows = await db.getAll('settings');
  const existing = rows[0];
  const { patch, next } = mergeSettings(existing);

  if (!existing) {
    await db.create('settings', {
      id: 'settings-1',
      siteName: MAIN_BRANCH.alternateName,
      tagline: 'Empowering Independence Through Safe Riding',
      phones: [...MAIN_BRANCH.phones],
      whatsapp: MAIN_BRANCH.phones[0],
      email: 'info@seekhoacademy.com',
      address: MAIN_BRANCH.formattedAddress,
      gmb_url: mapsSearchUrl(MAIN_BRANCH),
      facebookUrl: OFFICIAL_SOCIAL.facebookUrl,
      instagramUrl: OFFICIAL_SOCIAL.instagramUrl,
      youtubeUrl: OFFICIAL_SOCIAL.youtubeUrl,
      googleRating: 4.9,
      facebookRating: 4.8,
      reviewCount: 500,
      workingHours: 'Mon – Sun: 7:00 AM – 7:00 PM',
      trainedCandidates: '5000+',
      foundedYear: '2018'
    });
    log('settings: created settings-1 with Main Branch + official socials');
    return;
  }

  if (!Object.keys(patch).length) {
    log('settings: already up to date (no placeholder fields)');
    return;
  }

  await db.update('settings', existing.id, patch);
  log(`settings: updated keys → ${Object.keys(patch).join(', ')}`);
  log(`settings: facebook=${next.facebookUrl}`);
}

async function main() {
  log(`BASE_URL=${config.baseUrl}`);
  log(`Sheets enabled=${config.sheets.enabled} ready=${config.sheets.ready}`);

  if (!config.sheets.enabled) {
    console.error('GOOGLE_SHEETS_ENABLED must be true to sync content to Sheets.');
    console.error('For local JSON-only mode, seed defaults already include Phase 2 values.');
    process.exit(1);
  }
  if (!config.sheets.ready) {
    console.error('Google Sheets credentials incomplete. See .env.example.');
    process.exit(1);
  }

  await syncSettings();

  // Reserved helpers for later phases (blogs/locations by slug) — no-op payload today.
  await upsertByKey('blogs', 'slug', []);

  log('done (idempotent; unrelated Sheet rows untouched)');
}

main().catch((err) => {
  console.error('[sync-content] failed:', err.message || err);
  process.exit(1);
});
