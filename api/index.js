/**
 * Vercel serverless entry — Express app as a single function.
 * All /api/* and SSR routes are rewritten here via vercel.json.
 */
const app = require('../server/app');
const { ensureDataFiles } = require('../server/services/localStore');
const { ensureAdmin } = require('../server/services/auth');

let ready;

async function prepare() {
  if (ready) return ready;
  ready = (async () => {
    ensureDataFiles();
    await ensureAdmin();
    const db = require('../server/services/db');
    const banners = await db.getAll('banners');
    if (!banners.length) {
      console.log('[vercel] Seeding default content...');
      const seed = require('../scripts/seed');
      await seed();
    }
  })();
  return ready;
}

module.exports = async (req, res) => {
  try {
    await prepare();
  } catch (err) {
    console.error('[vercel bootstrap]', err);
  }
  return app(req, res);
};
