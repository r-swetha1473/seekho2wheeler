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
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
  }
  next();
});

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many submissions. Please try again later.' }
});
app.use('/api/bookings', formLimiter);
app.use('/api/enquiries', formLimiter);
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/chatbot/ask', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, message: 'Too many chat messages. Please try again later.' }
}));

/* Location SSOT (Phase 3) — before generic /api router */
app.get('/api/locations', (req, res) => {
  const { listPublicCards } = require('./content/locations');
  res.json({ success: true, data: listPublicCards() });
});
app.get('/api/locations/:slug', (req, res) => {
  const { getLocation, publicCard } = require('./content/locations');
  const loc = getLocation(req.params.slug);
  if (!loc) return res.status(404).json({ success: false, message: 'Location not found' });
  res.json({ success: true, data: { ...publicCard(loc), faqs: loc.faqs, trainingAvailable: loc.trainingAvailable, howToReach: loc.howToReach, landmark: loc.landmark } });
});

/* Course catalog SSOT (Phase 4) */
app.get('/api/courses', async (req, res, next) => {
  try {
    const db = require('./services/db');
    const { listPublicCards } = require('./content/courses');
    const pricing = await db.getAll('pricing');
    res.json({ success: true, data: listPublicCards(pricing) });
  } catch (err) {
    next(err);
  }
});
app.get('/api/courses/:slug', async (req, res, next) => {
  try {
    const db = require('./services/db');
    const { getPublicCourse, publicCard } = require('./content/courses');
    const pricing = await db.getAll('pricing');
    const course = getPublicCourse(req.params.slug, pricing);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({
      success: true,
      data: {
        ...publicCard(course),
        phase: course.phase,
        classesTiming: course.classesTiming,
        whatYouLearn: course.whatYouLearn,
        goal: course.goal,
        steps: course.steps || [],
        seo: course.seo,
        cta: course.cta
      }
    });
  } catch (err) {
    next(err);
  }
});

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
    cloudinaryReady: config.cloudinary.ready,
    mediaStorage: config.cloudinary.ready ? 'cloudinary' : (process.env.VERCEL ? 'none (configure Cloudinary)' : 'local-uploads (dev)'),
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

app.get('/p/:slug', (req, res) => {
  res.sendFile(path.join(publicDir, 'pages/detail.html'));
});

/* Phase 2 sitemap lists /women-training — serve approved women content */
app.get('/women-training', (req, res) => {
  res.redirect(302, '/p/women-empowerment');
});

app.get('/locations/:slug', (req, res) => {
  const { renderLocationHtml } = require('./services/locationRender');
  const html = renderLocationHtml(req.params.slug);
  if (!html) return res.status(404).sendFile(path.join(publicDir, 'pages/404.html'));
  res.type('html').send(html);
});

app.get('/courses', (req, res) => {
  res.redirect(302, '/pages/courses.html');
});

app.get('/courses/:slug', async (req, res, next) => {
  try {
    const db = require('./services/db');
    const { renderCourseHtml } = require('./services/courseRender');
    const { resolveSlug } = require('./content/courses');
    const canonicalSlug = resolveSlug(req.params.slug);
    if (!canonicalSlug) return res.status(404).sendFile(path.join(publicDir, 'pages/404.html'));
    if (canonicalSlug !== req.params.slug) {
      return res.redirect(301, `/courses/${canonicalSlug}`);
    }
    const pricing = await db.getAll('pricing');
    const html = renderCourseHtml(canonicalSlug, pricing);
    if (!html) return res.status(404).sendFile(path.join(publicDir, 'pages/404.html'));
    res.type('html').send(html);
  } catch (err) {
    next(err);
  }
});

app.get('/robots.txt', (req, res) => {
  const base = config.baseUrl;
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
    const { listPages } = require('./services/detailPages');
    const pages = (await listPages()).filter((p) => p.is_active !== false);
    const courses = (await db.getAll('pricing')).filter((p) => p.is_active !== false && p.active !== false);
    const { locationPaths } = require('./content/locations');
    const { coursePaths } = require('./content/courses');
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
      '/pages/faq.html',
      '/women-training'
    ];
    const urls = [
      ...staticPages.map(
        (p) => `  <url><loc>${base}${p || '/'}</loc><changefreq>weekly</changefreq><priority>${p ? '0.8' : '1.0'}</priority></url>`
      ),
      ...locationPaths().map(
        (p) => `  <url><loc>${base}${p}</loc><changefreq>weekly</changefreq><priority>0.85</priority></url>`
      ),
      ...coursePaths().map(
        (p) => `  <url><loc>${base}${p}</loc><changefreq>weekly</changefreq><priority>0.85</priority></url>`
      ),
      ...blogs.map(
        (b) => `  <url><loc>${base}/blog/${b.slug}</loc><lastmod>${String(b.updatedAt || b.publishedAt || '').slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
      ),
      ...pages.map((p) => {
        const last = String(p.updated_at || '').slice(0, 10);
        const lastTag = last ? `<lastmod>${last}</lastmod>` : '';
        return `  <url><loc>${base}/p/${p.slug}</loc>${lastTag}<changefreq>monthly</changefreq><priority>0.7</priority></url>`;
      }),
      ...courses.map((c) => {
        const slug = encodeURIComponent(c.slug || '');
        if (!slug) return '';
        return `  <url><loc>${base}/pages/detail.html?type=course&amp;slug=${slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
      }).filter(Boolean)
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
