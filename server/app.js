const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const apiRoutes = require('./routes/api');
const { errorHandler, notFound } = require('./middleware/error');

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

/* Health check for Vercel / uptime monitors */
app.get('/api/health', (req, res) => {
  const config = require('./config');
  const db = require('./services/db');
  const { credentialStatus } = require('./services/googleAuth');
  const creds = credentialStatus();
  res.json({
    success: true,
    message: 'Seekho API is online',
    env: process.env.VERCEL ? 'vercel' : config.nodeEnv,
    storage: db.useLocalStore() ? 'local-json (development)' : 'google-sheets (primary)',
    sheetsEnabled: config.sheets.enabled,
    sheetsReady: config.sheets.ready,
    sheetsMissing: creds.missing,
    sheetsHint: config.sheets.ready ? 'ok' : creds.hint,
    time: new Date().toISOString()
  });
});

app.use('/api', apiRoutes);

const publicDir = path.join(__dirname, '../public');
const adminDir = path.join(__dirname, '../admin');
const { UPLOAD_ROOT } = require('./services/upload');

if (process.env.VERCEL) {
  app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '1h' }));
}

app.use(
  express.static(publicDir, {
    maxAge: config.nodeEnv === 'production' ? '7d' : '1h',
    etag: true,
    setHeaders(res, filePath) {
      if (/\.(webp|jpg|jpeg|png|gif|svg)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
    }
  })
);
app.use('/admin', express.static(adminDir, { maxAge: 0 }));

app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(publicDir, 'pages/blog-detail.html'));
});

app.get('/robots.txt', (req, res) => {
  const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`);
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const db = require('./services/db');
    const blogs = (await db.getAll('blogs')).filter((b) => b.status !== 'draft');
    const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
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

module.exports = app;
