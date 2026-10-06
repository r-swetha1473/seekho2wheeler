/**
 * One template for every published special page.
 */
const config = require('../config');
const { getBySlug } = require('./specialCms');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inr(value) {
  if (value === '' || value == null || Number.isNaN(Number(value))) return '';
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function sectionHtml(page, section) {
  if (!section || section.enabled === false) return '';
  const heading = section.heading || '';
  const sub = section.subheading || '';
  if (section.type === 'hero' || section.key === 'hero') {
    return `
    <section class="page-hero loc-hero">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a><span>/</span>
          <span>${escapeHtml(page.menuLabel || page.name)}</span>
        </nav>
        ${page.offerText ? `<p class="section__eyebrow">${escapeHtml(page.offerText)}</p>` : ''}
        <h1>${escapeHtml(section.heading || page.heroHeading || page.name)}</h1>
        <p>${escapeHtml(section.subheading || page.heroSubheading || '')}</p>
        ${page.heroDescription ? `<p>${escapeHtml(page.heroDescription)}</p>` : ''}
        ${section.body || ''}
        <div class="loc-hero__actions">
          ${page.ctaText ? `<a class="btn btn--primary btn--lg" href="${escapeHtml(page.ctaLink || '/pages/booking.html')}">${escapeHtml(page.ctaText)}</a>` : ''}
        </div>
      </div>
    </section>`;
  }
  if (section.type === 'pricing' || section.key === 'pricing') {
    const now = inr(page.price);
    const was = inr(page.originalPrice);
    if (!now && !was && !page.offerText && !heading) return '';
    return `
    <section class="section">
      <div class="container" style="max-width:720px">
        <article class="loc-address-card special-price">
          ${heading ? `<h2 class="section__title" style="text-align:left">${escapeHtml(heading)}</h2>` : ''}
          ${page.offerText ? `<p class="section__eyebrow">${escapeHtml(page.offerText)}</p>` : ''}
          ${now ? `<p class="special-price__now">${escapeHtml(now)}</p>` : ''}
          ${was ? `<p class="special-price__was">${escapeHtml(was)}</p>` : ''}
          ${sub ? `<p>${escapeHtml(sub)}</p>` : ''}
        </article>
      </div>
    </section>`;
  }
  if (section.type === 'timing' || section.key === 'timing') {
    if (!page.timingText && !page.daysText && !heading) return '';
    return `
    <section class="section section--alt">
      <div class="container loc-grid-2">
        <div>
          ${heading ? `<h2 class="section__title" style="text-align:left">${escapeHtml(heading)}</h2>` : ''}
          <ul class="loc-list">
            ${page.timingText ? `<li>${escapeHtml(page.timingText)}</li>` : ''}
            ${page.daysText ? `<li>${escapeHtml(page.daysText)}</li>` : ''}
          </ul>
        </div>
        <div class="loc-address-card">
          <h3><i class="fa-solid fa-clock" aria-hidden="true"></i> Offer hours</h3>
          <p>These hours are for this offer. Class times are chosen when you book.</p>
        </div>
      </div>
    </section>`;
  }
  if (section.type === 'faq' || section.key === 'faq') {
    const items = section.items || [];
    if (!items.length && !heading) return '';
    return `
    <section class="section">
      <div class="container">
        <div class="section__head">
          ${sub ? `<span class="section__eyebrow">${escapeHtml(sub)}</span>` : ''}
          <h2 class="section__title">${escapeHtml(heading || 'Questions')}</h2>
        </div>
        <div class="faq-list" id="specialFaq">
          ${items.map((item) => `
            <div class="faq-item">
              <button class="faq-item__q" type="button">${escapeHtml(item.title)} <i class="fa-solid fa-chevron-down"></i></button>
              <div class="faq-item__a">${escapeHtml(item.text)}</div>
            </div>`).join('')}
        </div>
      </div>
    </section>`;
  }
  if (section.type === 'cta' || section.key === 'cta') {
    return `
    <section class="section section--alt">
      <div class="container" style="text-align:center">
        <h2 class="section__title">${escapeHtml(heading || page.heroHeading || page.name)}</h2>
        ${sub ? `<p class="section__desc">${escapeHtml(sub)}</p>` : ''}
        ${section.body || ''}
        ${page.ctaText ? `<a class="btn btn--primary btn--lg" href="${escapeHtml(page.ctaLink || '/pages/booking.html')}">${escapeHtml(page.ctaText)}</a>` : ''}
      </div>
    </section>`;
  }
  const items = section.items || [];
  const itemHtml = items.length
    ? `<div class="loc-usp-grid">${items.map((item) => `
        <article class="loc-usp">
          <h3>${escapeHtml(item.title)}</h3>
          ${item.text ? `<p>${escapeHtml(item.text)}</p>` : ''}
        </article>`).join('')}</div>`
    : '';
  if (!heading && !sub && !section.body && !itemHtml) return '';
  return `
    <section class="section">
      <div class="container">
        <div class="section__head">
          ${sub ? `<span class="section__eyebrow">${escapeHtml(sub)}</span>` : ''}
          ${heading ? `<h2 class="section__title">${escapeHtml(heading)}</h2>` : ''}
        </div>
        ${section.body || ''}
        ${itemHtml}
      </div>
    </section>`;
}

function imageBlock(page) {
  if (!page.heroImage) return '';
  return `<section class="section"><div class="container"><img src="${escapeHtml(page.heroImage)}" alt="${escapeHtml(page.heroHeading || page.name)}" style="width:100%;border-radius:16px;max-height:420px;object-fit:cover"></div></section>`;
}

async function renderSpecialHtml(slug) {
  const page = await getBySlug(slug, { publicOnly: true });
  if (!page) return null;
  const origin = String(config.baseUrl || '').replace(/\/$/, '');
  const canonical = `${origin}/special/${page.slug}`;
  const title = page.seoTitle || `${page.name} | Seekho Two Wheeler Academy`;
  const description = page.seoDescription || page.heroDescription || page.heroSubheading || '';
  const ogTitle = page.ogTitle || title;
  const ogDescription = page.ogDescription || description;
  const sections = (page.sections || [])
    .filter((section) => section.enabled !== false)
    .sort((a, b) => a.order - b.order)
    .map((section) => sectionHtml(page, section))
    .join('\n');
  const heroIndex = (page.sections || []).findIndex((section) => section.key === 'hero' && section.enabled !== false);
  const withImage = heroIndex >= 0
    ? sections
    : imageBlock(page) + sections;

  return `<!DOCTYPE html>
<html lang="en" class="customer-site">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  ${page.ogImage ? `<meta property="og:image" content="${escapeHtml(page.ogImage)}">` : ''}
  ${page.heroImage && !page.ogImage ? `<meta property="og:image" content="${escapeHtml(page.heroImage)}">` : ''}
  <meta property="og:site_name" content="Seekho Two Wheeler Academy">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css">
  <link rel="stylesheet" href="/css/main.css">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/brand/favicon-32.png">
  <link rel="stylesheet" href="/css/customer-theme.css">
</head>
<body class="customer-site" data-special-slug="${escapeHtml(page.slug)}">
  <div class="page-loader"><div class="spinner"></div></div>
  <div id="site-header-mount"></div>
  <main>
    ${withImage}
    ${page.heroImage && heroIndex >= 0 ? imageBlock(page) : ''}
  </main>
  <div id="site-footer-mount"></div>
  <script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"></script>
  <script src="/js/layout.js"></script>
  <script src="/js/config.js"></script>
  <script src="/js/sanitize-html.js"></script>
  <script src="/js/app.js"></script>
  <script>
    document.querySelectorAll('#specialFaq .faq-item__q, #specialFaq .faq-item__q').forEach(function () {});
    if (window.Seekho && typeof window.Seekho.initFaq === 'function') {
      var faq = document.getElementById('specialFaq');
      if (faq) window.Seekho.initFaq(faq);
    }
  </script>
</body>
</html>`;
}

module.exports = { renderSpecialHtml };
