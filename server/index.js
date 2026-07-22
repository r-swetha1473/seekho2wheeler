const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const apiRoutes = require('./routes/api');
const { errorHandler, notFound } = require('./middleware/error');
const { ensureAdmin } = require('./services/auth');
const { ensureDataFiles } = require('./services/localStore');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many submissions. Please try again later.' }
});
app.use('/api/bookings', formLimiter);
app.use('/api/enquiries', formLimiter);
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

app.use('/api', apiRoutes);

app.use(
  express.static(path.join(__dirname, '../public'), {
    maxAge: config.nodeEnv === 'production' ? '7d' : '1h',
    etag: true,
    setHeaders(res, filePath) {
      if (/\.(webp|jpg|jpeg|png|gif|svg)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
    }
  })
);
app.use(
  '/admin',
  express.static(path.join(__dirname, '../admin'), {
    maxAge: 0
  })
);

app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/blog-detail.html'));
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${config.baseUrl}/sitemap.xml
`);
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const db = require('./services/db');
    const blogs = (await db.getAll('blogs')).filter((b) => b.status !== 'draft');
    const base = config.baseUrl;
    const staticPages = [
      '',
      '/pages/about.html',
      '/pages/courses.html',
      '/pages/branches.html',
      '/pages/gallery.html',
      '/pages/blog.html',
      '/pages/reviews.html',
      '/pages/contact.html',
      '/pages/booking.html',
      '/pages/faq.html'
    ];
    const urls = [
      ...staticPages.map(
        (p) => `  <url><loc>${base}${p || '/'}</loc><changefreq>weekly</changefreq><priority>${p ? '0.8' : '1.0'}</priority></url>`
      ),
      ...blogs.map(
        (b) => `  <url><loc>${base}/blog/${b.slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`
      )
    ];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`);
  } catch (err) {
    res.status(500).send('Sitemap unavailable');
  }
});

app.use(notFound);
app.use(errorHandler);

async function start() {
  ensureDataFiles();
  await ensureAdmin();

  // Auto-seed if empty
  const db = require('./services/db');
  const banners = await db.getAll('banners');
  if (!banners.length) {
    console.log('No data found — running seed...');
    const seed = require('../scripts/seed');
    await seed();
  }

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

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
