require('dotenv').config();

const config = require('./config');
const app = require('./app');
const { ensureAdmin } = require('./services/auth');
const { ensureDataFiles } = require('./services/localStore');

async function bootstrap() {
  ensureDataFiles();
  await ensureAdmin();

  const db = require('./services/db');
  const banners = await db.getAll('banners');
  if (!banners.length) {
    console.log('No data found — running seed...');
    const seed = require('../scripts/seed');
    await seed();
  }
}

async function start() {
  await bootstrap();
  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║   Seekho Two Wheeler Academy                     ║
║   Server running on http://localhost:${config.port}        ║
║   Admin Panel: http://localhost:${config.port}/admin       ║
╚══════════════════════════════════════════════════╝
`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
module.exports.bootstrap = bootstrap;
