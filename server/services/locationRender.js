/**
 * Server-render location pages so raw HTML includes unique SEO + JSON-LD.
 */
const {
  getLocation,
  localBusinessJsonLd,
  faqPageJsonLd,
  breadcrumbJsonLd,
  baseUrl
} = require('../content/locations');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLocationHtml(slug) {
  const loc = getLocation(slug);
  if (!loc) return null;
  const base = baseUrl();
  const canonical = `${base}/locations/${loc.slug}`;
  const schema = JSON.stringify([
    localBusinessJsonLd(loc, base),
    faqPageJsonLd(loc),
    breadcrumbJsonLd(loc, base)
  ]);

  const usps = (loc.usps || [])
    .map(
      (u) => `
      <article class="loc-usp">
        <div class="loc-usp__icon"><i class="${escapeHtml(u.icon)}" aria-hidden="true"></i></div>
        <h3>${escapeHtml(u.title)}</h3>
        <p>${escapeHtml(u.text)}</p>
      </article>`
    )
    .join('');

  const training = loc.trainingAvailable?.length
    ? `<ul class="loc-list">${loc.trainingAvailable.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`
    : `<p class="loc-note">${escapeHtml(loc.trainingNote || 'Confirm current courses when you book or call.')}</p>`;

  const who = `<ul class="loc-list">${(loc.whoCanLearn || []).map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
  const reach = `<ul class="loc-list">${(loc.howToReach || []).map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
  const faqs = (loc.faqs || [])
    .map(
      (f) => `
      <div class="faq-item">
        <button class="faq-item__q" type="button">${escapeHtml(f.q)} <i class="fa-solid fa-chevron-down"></i></button>
        <div class="faq-item__a">${escapeHtml(f.a)}</div>
      </div>`
    )
    .join('');

  const phones = loc.phones
    .map((p) => `<a href="tel:${escapeHtml(p)}">${escapeHtml(p)}</a>`)
    .join(' <span class="phone-sep" aria-hidden="true">·</span> ');

  const floating = loc.showFloatingReviews
    ? `<aside class="loc-float-reviews" data-loc-float-reviews hidden>
         <strong>Learner feedback</strong>
         <p>Read Google reviews for Seekho training.</p>
         <a class="btn btn--sm btn--primary" data-gmb-link href="/pages/reviews.html" target="_blank" rel="noopener">Google Reviews</a>
       </aside>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" class="customer-site">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(loc.seo.title)}</title>
  <meta name="description" content="${escapeHtml(loc.seo.description)}">
  <meta name="keywords" content="${escapeHtml((loc.seo.keywords || []).join(', '))}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(loc.seo.title)}">
  <meta property="og:description" content="${escapeHtml(loc.seo.description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:site_name" content="Seekho Two Wheeler Academy">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(loc.seo.title)}">
  <meta name="twitter:description" content="${escapeHtml(loc.seo.description)}">
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
<body class="customer-site" data-location-slug="${escapeHtml(loc.slug)}" data-gallery-category="${escapeHtml(loc.galleryCategory)}">
  <div class="page-loader"><div class="spinner"></div></div>
  <div id="site-header-mount"></div>

  <main>
    <section class="page-hero loc-hero">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a><span>/</span>
          <a href="/pages/branches.html">Branches</a><span>/</span>
          <span>${escapeHtml(loc.displayName)}</span>
        </nav>
        <p class="section__eyebrow">${escapeHtml(loc.hero.eyebrow)}</p>
        <h1>${escapeHtml(loc.hero.h1)}</h1>
        <p>${escapeHtml(loc.hero.subtitle)}</p>
        <div class="loc-hero__actions">
          <a class="btn btn--primary" href="/pages/booking.html?branch=${encodeURIComponent(loc.branchName)}">Book at ${escapeHtml(loc.displayName)}</a>
          <a class="btn btn--outline" href="${escapeHtml(loc.mapsLink || '/pages/branches.html')}" target="_blank" rel="noopener">Open Maps</a>
        </div>
        <p class="loc-hero__phones phones-inline">${phones}</p>
      </div>
    </section>

    <section class="section">
      <div class="container loc-grid-2">
        <div>
          <h2 class="section__title" style="text-align:left">${escapeHtml(loc.why.title)}</h2>
          <p>${escapeHtml(loc.why.body)}</p>
          <p class="loc-meta"><strong>${escapeHtml(loc.establishedLabel)}</strong> · ${escapeHtml(loc.landmark)}</p>
        </div>
        <div class="loc-address-card">
          <h3><i class="fa-solid fa-location-dot"></i> ${escapeHtml(loc.displayName)}</h3>
          <p>${escapeHtml(loc.address)}</p>
          ${loc.mapsLink ? `<a class="btn btn--sm btn--primary" href="${escapeHtml(loc.mapsLink)}" target="_blank" rel="noopener">Google Maps</a>` : ''}
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="section__head">
          <span class="section__eyebrow">What Makes This Branch Different</span>
          <h2 class="section__title">Highlights of ${escapeHtml(loc.displayName)}</h2>
        </div>
        <div class="loc-usp-grid">${usps}</div>
      </div>
    </section>

    <section class="section">
      <div class="container loc-grid-2">
        <div>
          <h2 class="section__title" style="text-align:left">Training Available</h2>
          ${training}
        </div>
        <div>
          <h2 class="section__title" style="text-align:left">Who Can Learn Here</h2>
          ${who}
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="section__head">
          <span class="section__eyebrow">Directions</span>
          <h2 class="section__title">How to Reach</h2>
        </div>
        ${reach}
        ${loc.embedUrl ? `<div class="map-embed loc-map"><iframe title="${escapeHtml(loc.displayName)} map" src="${escapeHtml(loc.embedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>` : ''}
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section__head">
          <span class="section__eyebrow">Photos</span>
          <h2 class="section__title">${escapeHtml(loc.displayName)} Gallery</h2>
          <p class="section__desc">Photos from admin gallery category “${escapeHtml(loc.galleryCategory)}”.</p>
        </div>
        <div class="gallery-grid-uniform" id="locGallery" data-aos="fade-up">
          <div class="skeleton" style="height:180px"></div>
          <div class="skeleton" style="height:180px"></div>
          <div class="skeleton" style="height:180px"></div>
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container loc-grid-2">
        <div>
          <h2 class="section__title" style="text-align:left">${escapeHtml(loc.women.title)}</h2>
          <p>${escapeHtml(loc.women.body)}</p>
          <a class="btn btn--primary" href="/pages/booking.html?branch=${encodeURIComponent(loc.branchName)}" style="margin-top:1rem">Book Ladies Training</a>
        </div>
        <div>
          <h2 class="section__title" style="text-align:left">Learner Reviews</h2>
          <div id="locReviews"><div class="skeleton" style="height:160px"></div></div>
          <p style="margin-top:1rem"><a class="btn btn--outline btn--sm" href="/pages/reviews.html">Read All Reviews</a></p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section__head">
          <span class="section__eyebrow">FAQ</span>
          <h2 class="section__title">${escapeHtml(loc.displayName)} Questions</h2>
        </div>
        <div class="faq-list" id="locFaq">${faqs}</div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container" style="text-align:center">
        <h2 class="section__title">Ready to Train at ${escapeHtml(loc.displayName)}?</h2>
        <p class="section__desc">Book a slot or call us on the official Seekho numbers.</p>
        <div class="loc-hero__actions" style="justify-content:center">
          <a class="btn btn--primary btn--lg" href="/pages/booking.html?branch=${encodeURIComponent(loc.branchName)}">Book Training</a>
          <a class="btn btn--outline btn--lg" href="https://wa.me/91${escapeHtml(loc.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
    </section>
  </main>

  ${floating}
  <div id="site-footer-mount"></div>
  <script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"></script>
  <script src="/js/layout.js"></script>
  <script src="/js/config.js"></script>
  <script src="/js/sanitize-html.js"></script>
  <script src="/js/app.js"></script>
  <script src="/js/pages/location.js"></script>
</body>
</html>`;
}

module.exports = { renderLocationHtml };
