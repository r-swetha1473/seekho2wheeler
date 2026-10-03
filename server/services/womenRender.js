/**
 * Server-render Women's Training page (Phase 5).
 */
const {
  getWomenTraining,
  baseUrl,
  breadcrumbJsonLd,
  webPageJsonLd,
  GALLERY_CATEGORY
} = require('../content/womenTraining');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderWomenTrainingHtml() {
  const w = getWomenTraining();
  const base = baseUrl();
  const canonical = `${base}/women-training`;
  const schema = JSON.stringify([webPageJsonLd(base), breadcrumbJsonLd(base)]);

  const benefits = w.benefits
    .map(
      (b) => `
      <article class="women-usp">
        <div class="women-usp__icon" aria-hidden="true"><i class="${escapeHtml(b.icon)}"></i></div>
        <h3 class="women-usp__title">${escapeHtml(b.title)}</h3>
        <p class="women-usp__text">${escapeHtml(b.text)}</p>
      </article>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en" class="customer-site">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(w.seo.title)}</title>
  <meta name="description" content="${escapeHtml(w.seo.description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(w.seo.title)}">
  <meta property="og:description" content="${escapeHtml(w.seo.description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:site_name" content="Seekho Two Wheeler Academy">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(w.seo.title)}">
  <meta name="twitter:description" content="${escapeHtml(w.seo.description)}">
  <script type="application/ld+json">${schema}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css">
  <link rel="stylesheet" href="/css/main.css">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/brand/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/brand/favicon-16.png">
  <link rel="apple-touch-icon" href="/images/brand/apple-touch-icon.png">
  <link rel="stylesheet" href="/css/customer-theme.css">
</head>
<body class="customer-site" data-gallery-category="${escapeHtml(GALLERY_CATEGORY)}">
  <div class="page-loader"><div class="spinner"></div></div>
  <div id="site-header-mount"></div>
  <main>
    <section class="page-hero">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a><span>/</span><span>Women's Training</span>
        </nav>
        <h1>${escapeHtml(w.pageTitle)}</h1>
        <p>${escapeHtml(w.supportLine)}</p>
      </div>
    </section>

    <section class="section">
      <div class="container women-intro-grid">
        <div class="women-intro__copy" data-aos="fade-up">
          <span class="section__eyebrow">${escapeHtml(w.homeEyebrow)}</span>
          <h2 class="section__title" style="text-align:left">${escapeHtml(w.homeHeadline)}</h2>
          <p class="section__desc" style="text-align:left;margin:0">${escapeHtml(w.intro)}</p>
        </div>
        <div class="women-intro__media media-frame media-frame--43" data-aos="fade-up">
          <img class="img-cover" src="${escapeHtml(w.heroImage)}" alt="Women learning to ride at Seekho" width="1200" height="900" loading="eager">
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="section__head" data-aos="fade-up">
          <span class="section__eyebrow">Why Learn With Seekho</span>
          <h2 class="section__title">Built For Women Learners</h2>
        </div>
        <div class="women-usp-grid" data-aos="fade-up">
          ${benefits}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section__head" data-aos="fade-up">
          <span class="section__eyebrow">Gallery</span>
          <h2 class="section__title">${escapeHtml(w.gallery.title)}</h2>
          <p class="section__desc">${escapeHtml(w.gallery.subtitle)}</p>
        </div>
        <div class="gallery-grid-uniform" id="womenGalleryGrid" data-aos="fade-up">
          <div class="skeleton" style="height:220px"></div>
          <div class="skeleton" style="height:220px"></div>
          <div class="skeleton" style="height:220px"></div>
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="women-stat" data-aos="fade-up">
          <p class="women-stat__value">${escapeHtml(w.statistic)}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container" style="text-align:center" data-aos="fade-up">
        <h2 class="section__title">${escapeHtml(w.finalCta.heading)}</h2>
        <a class="btn btn--primary btn--lg" href="${escapeHtml(w.finalCta.href)}">${escapeHtml(w.finalCta.button)}</a>
      </div>
    </section>
  </main>
  <div id="site-footer-mount"></div>
  <script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"></script>
  <script src="/js/layout.js"></script>
  <script src="/js/config.js"></script>
  <script src="/js/sanitize-html.js"></script>
  <script src="/js/app.js"></script>
  <script src="/js/pages/women-training.js"></script>
</body>
</html>`;
}

module.exports = { renderWomenTrainingHtml };
