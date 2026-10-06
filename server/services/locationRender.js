/**
 * Server-render location pages from CMS data, with the existing Seekho layout.
 */
const { resolve, schemaFor } = require('./locationCms');
const { baseUrl } = require('../content/locations');

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

function sectionRow(view, key) {
  return (view.sections || []).find((row) => row.key === key) || null;
}

function enabled(view, key) {
  const row = sectionRow(view, key);
  if (!row) return key !== 'floatingReviews';
  return row.enabled !== false;
}

function heading(view, key, fallback) {
  const row = sectionRow(view, key);
  return (row && row.heading) || fallback || '';
}

function subheading(view, key, fallback) {
  const row = sectionRow(view, key);
  return (row && row.subheading) || fallback || '';
}

function listHtml(items) {
  if (!items || !items.length) return '';
  return `<ul class="loc-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function chunksFor(view) {
  const bookHref = view.ctaLink || `/pages/booking.html?branchId=${encodeURIComponent(view.branchId)}&branch=${encodeURIComponent(view.slug)}`;
  const phones = (view.phones || [])
    .map((phone) => `<a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>`)
    .join(' <span class="phone-sep" aria-hidden="true">·</span> ');

  const chunks = {};
  chunks.hero = `
    <section class="page-hero loc-hero">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a><span>/</span>
          <a href="/pages/branches.html">Branches</a><span>/</span>
          <span>${escapeHtml(view.shortName)}</span>
        </nav>
        <p class="section__eyebrow">${escapeHtml(view.hero.eyebrow)}</p>
        <h1>${escapeHtml(view.hero.h1)}</h1>
        <p>${escapeHtml(view.hero.subtitle)}</p>
        ${view.introHtml ? `<div class="loc-intro">${view.introHtml}</div>` : ''}
        <div class="loc-hero__actions">
          <a class="btn btn--primary" href="${escapeHtml(bookHref)}">Book at ${escapeHtml(view.shortName)}</a>
          <a class="btn btn--outline" href="${escapeHtml(view.mapsLink || '/pages/branches.html')}" target="_blank" rel="noopener">Open Maps</a>
        </div>
        <p class="loc-hero__phones phones-inline">${phones}</p>
      </div>
    </section>`;

  chunks.why = `
    <section class="section">
      <div class="container loc-grid-2">
        <div>
          <h2 class="section__title" style="text-align:left">${escapeHtml(heading(view, 'why', view.why.title))}</h2>
          <p>${escapeHtml(view.why.body)}</p>
          <p class="loc-meta"><strong>${escapeHtml(view.establishedLabel)}</strong>${view.landmark ? ` · ${escapeHtml(view.landmark)}` : ''}</p>
        </div>
        <div class="loc-address-card">
          <h3><i class="fa-solid fa-location-dot"></i> ${escapeHtml(view.shortName)}</h3>
          <p>${escapeHtml(view.address)}</p>
          ${view.mapsLink ? `<a class="btn btn--sm btn--primary" href="${escapeHtml(view.mapsLink)}" target="_blank" rel="noopener">Google Maps</a>` : ''}
        </div>
      </div>
    </section>`;

  const usps = (view.highlights || []).map((item) => `
      <article class="loc-usp">
        <div class="loc-usp__icon"><i class="${escapeHtml(item.icon)}" aria-hidden="true"></i></div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>`).join('');
  chunks.highlights = `
    <section class="section section--alt">
      <div class="container">
        <div class="section__head">
          <span class="section__eyebrow">${escapeHtml(subheading(view, 'highlights', 'What Makes This Branch Different'))}</span>
          <h2 class="section__title">${escapeHtml(heading(view, 'highlights', `Highlights of ${view.shortName}`))}</h2>
        </div>
        <div class="loc-usp-grid">${usps}</div>
      </div>
    </section>`;

  chunks.training = `
    <section class="section" data-loc-block="training">
      <div class="container">
        <h2 class="section__title" style="text-align:left">${escapeHtml(heading(view, 'training', 'Training Available'))}</h2>
        ${view.trainingAvailable.length ? listHtml(view.trainingAvailable) : '<p class="loc-note">Confirm current courses when you book or call.</p>'}
      </div>
    </section>`;

  chunks.whoCanLearn = `
    <section class="section" data-loc-block="who">
      <div class="container">
        <h2 class="section__title" style="text-align:left">${escapeHtml(heading(view, 'whoCanLearn', 'Who Can Learn Here'))}</h2>
        ${listHtml(view.whoCanLearn)}
      </div>
    </section>`;

  const prices = (view.pricing || []).filter((row) => row.active !== false);
  chunks.pricing = `
    <section class="section section--alt">
      <div class="container">
        <div class="section__head">
          <span class="section__eyebrow">Fees at this centre</span>
          <h2 class="section__title">${escapeHtml(heading(view, 'pricing', 'Training Fees'))}</h2>
          <p class="section__desc">${escapeHtml(subheading(view, 'pricing', 'Display prices for this centre. The fee charged at booking follows the course you select.'))}</p>
        </div>
        <div class="loc-usp-grid">
          ${prices.map((row) => {
            const now = inr(row.offerPrice !== '' && row.offerPrice != null ? row.offerPrice : row.price);
            const was = row.offerPrice !== '' && row.offerPrice != null && row.price !== '' ? inr(row.price) : '';
            return `<article class="loc-usp">
              <h3>${escapeHtml(row.name)}</h3>
              <p class="special-price__now">${escapeHtml(now || 'Ask for the current fee')}</p>
              ${was ? `<p class="special-price__was">${escapeHtml(was)}</p>` : ''}
              ${row.duration ? `<p>${escapeHtml(row.duration)}</p>` : ''}
              ${row.sessions !== '' && row.sessions != null ? `<p>${escapeHtml(String(row.sessions))} sessions</p>` : ''}
            </article>`;
          }).join('') || '<p class="loc-note">Fees for this centre will be published here.</p>'}
        </div>
      </div>
    </section>`;

  const timing = view.timing || {};
  chunks.timing = `
    <section class="section">
      <div class="container loc-grid-2">
        <div>
          <span class="section__eyebrow">${escapeHtml(subheading(view, 'timing', 'Visitor information'))}</span>
          <h2 class="section__title" style="text-align:left">${escapeHtml(heading(view, 'timing', 'Centre Timings'))}</h2>
          <ul class="loc-list">
            ${timing.opening || timing.closing ? `<li>${escapeHtml(timing.opening || '')}${timing.closing ? ` – ${escapeHtml(timing.closing)}` : ''}</li>` : ''}
            ${timing.workingDays ? `<li>${escapeHtml(timing.workingDays)}</li>` : ''}
            ${timing.weekend ? `<li>Weekend: ${escapeHtml(timing.weekend)}</li>` : ''}
            ${timing.special ? `<li>${escapeHtml(timing.special)}</li>` : ''}
            ${timing.slotDuration ? `<li>Each session: ${escapeHtml(timing.slotDuration)}</li>` : ''}
          </ul>
        </div>
        <div class="loc-address-card">
          <h3><i class="fa-solid fa-clock" aria-hidden="true"></i> Centre hours</h3>
          <p>These hours tell visitors when the centre is open. Class times are chosen on the booking page.</p>
        </div>
      </div>
    </section>`;

  chunks.howToReach = `
    <section class="section section--alt">
      <div class="container">
        <div class="section__head">
          <span class="section__eyebrow">${escapeHtml(subheading(view, 'howToReach', 'Directions'))}</span>
          <h2 class="section__title">${escapeHtml(heading(view, 'howToReach', 'How to Reach'))}</h2>
        </div>
        ${listHtml(view.howToReach)}
        ${view.embedUrl ? `<div class="map-embed loc-map"><iframe title="${escapeHtml(view.shortName)} map" src="${escapeHtml(view.embedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>` : ''}
      </div>
    </section>`;

  chunks.gallery = `
    <section class="section">
      <div class="container">
        <div class="section__head">
          <span class="section__eyebrow">${escapeHtml(subheading(view, 'gallery', 'Photos'))}</span>
          <h2 class="section__title">${escapeHtml(heading(view, 'gallery', `${view.shortName} Gallery`))}</h2>
          <p class="section__desc">Photos from this centre.</p>
        </div>
        <div class="gallery-grid-uniform" id="locGallery" data-aos="fade-up">
          <div class="skeleton" style="height:180px"></div>
          <div class="skeleton" style="height:180px"></div>
          <div class="skeleton" style="height:180px"></div>
        </div>
      </div>
    </section>`;

  chunks.women = `
    <section class="section section--alt" data-loc-block="women">
      <div class="container">
        <h2 class="section__title" style="text-align:left">${escapeHtml(heading(view, 'women', view.women.title))}</h2>
        <p>${escapeHtml(view.women.body)}</p>
        <a class="btn btn--primary" href="${escapeHtml(bookHref)}" style="margin-top:1rem">Book Ladies Training</a>
      </div>
    </section>`;

  chunks.reviews = `
    <section class="section" data-loc-block="reviews">
      <div class="container">
        <h2 class="section__title" style="text-align:left">${escapeHtml(heading(view, 'reviews', 'Learner Reviews'))}</h2>
        <div id="locReviews"><div class="skeleton" style="height:160px"></div></div>
        <p style="margin-top:1rem"><a class="btn btn--outline btn--sm" href="/pages/reviews.html">Read All Reviews</a></p>
      </div>
    </section>`;

  const faqs = (view.faqs || []).map((item) => `
      <div class="faq-item">
        <button class="faq-item__q" type="button">${escapeHtml(item.q)} <i class="fa-solid fa-chevron-down"></i></button>
        <div class="faq-item__a">${escapeHtml(item.a)}</div>
      </div>`).join('');
  chunks.faq = `
    <section class="section section--alt">
      <div class="container">
        <div class="section__head">
          <span class="section__eyebrow">${escapeHtml(subheading(view, 'faq', 'FAQ'))}</span>
          <h2 class="section__title">${escapeHtml(heading(view, 'faq', `${view.shortName} Questions`))}</h2>
        </div>
        <div class="faq-list" id="locFaq">${faqs}</div>
      </div>
    </section>`;

  chunks.cta = `
    <section class="section">
      <div class="container" style="text-align:center">
        <h2 class="section__title">${escapeHtml(heading(view, 'cta', `Ready to Train at ${view.shortName}?`))}</h2>
        <p class="section__desc">${escapeHtml(subheading(view, 'cta', 'Book a slot or call us on the official Seekho numbers.'))}</p>
        <div class="loc-hero__actions" style="justify-content:center">
          <a class="btn btn--primary btn--lg" href="${escapeHtml(bookHref)}">${escapeHtml(view.ctaText || 'Book Training')}</a>
          ${view.whatsapp ? `<a class="btn btn--outline btn--lg" href="https://wa.me/91${escapeHtml(view.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        </div>
      </div>
    </section>`;

  return chunks;
}

function orderedHtml(view) {
  const chunks = chunksFor(view);
  const order = (view.sections || [])
    .filter((row) => row.key !== 'floatingReviews' && enabled(view, row.key) && chunks[row.key])
    .sort((a, b) => a.order - b.order);
  return order.map((row) => chunks[row.key]).join('\n');
}

function documentFor(view) {
  const origin = baseUrl();
  const canonical = `${origin}/locations/${view.slug}`;
  const schema = JSON.stringify(schemaFor(view, origin));
  const title = view.seo.title || view.pageTitle || view.shortName;
  const description = view.seo.description || '';
  const ogTitle = view.ogTitle || title;
  const ogDescription = view.ogDescription || description;
  const floating = view.showFloatingReviews
    ? `<aside class="loc-float-reviews" data-loc-float-reviews hidden>
         <strong>Learner feedback</strong>
         <p>Read Google reviews for Seekho training.</p>
         <a class="btn btn--sm btn--primary" data-gmb-link href="/pages/reviews.html" target="_blank" rel="noopener">Google Reviews</a>
       </aside>`
    : '';
  const keywords = (view.seo.keywords || []).join(', ');
  const ogImage = view.ogImage
    ? `<meta property="og:image" content="${escapeHtml(view.ogImage)}">`
    : '';

  return `<!DOCTYPE html>
<html lang="en" class="customer-site">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : ''}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  ${ogImage}
  <meta property="og:site_name" content="Seekho Two Wheeler Academy">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
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
<body class="customer-site" data-location-slug="${escapeHtml(view.slug)}" data-gallery-category="${escapeHtml(view.galleryCategory)}">
  <div class="page-loader"><div class="spinner"></div></div>
  <div id="site-header-mount"></div>
  <main>
    ${orderedHtml(view)}
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

async function renderLocationHtml(slug) {
  const result = await resolve(slug);
  if (!result || result.status !== 'ok' || !result.view) return null;
  return documentFor(result.view);
}

module.exports = { renderLocationHtml, documentFor };
