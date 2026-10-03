/**
 * Server-render course detail pages (Phase 4) with SEO + Course/Breadcrumb JSON-LD.
 */
const {
  getPublicCourse,
  courseJsonLd,
  breadcrumbJsonLd,
  baseUrl
} = require('../content/courses');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function listHtml(items) {
  if (!items?.length) return '';
  return `<ul class="course-detail__features">${items
    .map(
      (item) =>
        `<li><i class="fa-solid fa-check" aria-hidden="true"></i><span>${escapeHtml(item)}</span></li>`
    )
    .join('')}</ul>`;
}

function renderCourseHtml(slug, pricingRows) {
  const course = getPublicCourse(slug, pricingRows);
  if (!course) return null;
  const base = baseUrl();
  const canonical = `${base}/courses/${course.slug}`;
  const schema = JSON.stringify([courseJsonLd(course, base), breadcrumbJsonLd(course, base)]);

  const priceBlock = course.isDoorstep
    ? `<p class="course-detail__price">Distance-based</p>
       <p class="course-detail__classes">Use the calculator — existing Phase 1 doorstep pricing</p>`
    : course.showPrice && course.priceFrom != null
      ? `<p class="course-detail__price">${escapeHtml(course.priceLabel || `From ₹${course.priceFrom}`)}</p>`
      : `<p class="course-detail__price">Price on request</p>`;

  const doorstepWidget = course.isDoorstep
    ? `<div class="doorstep-price course-doorstep-calc" data-doorstep-widget data-aos="fade-up">
         <h3 class="doorstep-price__title">Check your doorstep price</h3>
         <label class="doorstep-price__label" for="courseDoorstepKm">Distance (km)</label>
         <input class="doorstep-price__input" id="courseDoorstepKm" type="number" min="0.1" step="0.1" inputmode="decimal" data-doorstep-km placeholder="e.g. 5">
         <p class="doorstep-price__result" data-doorstep-result aria-live="polite"></p>
         <p class="doorstep-price__hint" data-doorstep-hint>Up to 3 km → ₹4,500 · +₹500/km · max ₹8,000 · over 10 km unavailable</p>
       </div>`
    : '';

  const steps =
    course.steps?.length ?
      `<section class="course-section" data-aos="fade-up">
        <h2>How Doorstep Training Works</h2>
        <ol class="course-steps">
          ${course.steps
            .map(
              (s) =>
                `<li class="course-steps__item"><strong>${escapeHtml(s.title)}</strong><p>${escapeHtml(s.body)}</p></li>`
            )
            .join('')}
        </ol>
      </section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" class="customer-site">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(course.seo.title)}</title>
  <meta name="description" content="${escapeHtml(course.seo.description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(course.seo.title)}">
  <meta property="og:description" content="${escapeHtml(course.seo.description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:site_name" content="Seekho Two Wheeler Academy">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(course.seo.title)}">
  <meta name="twitter:description" content="${escapeHtml(course.seo.description)}">
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
<body class="customer-site" data-course-slug="${escapeHtml(course.slug)}">
  <div class="page-loader"><div class="spinner"></div></div>
  <div id="site-header-mount"></div>
  <main>
    <section class="page-hero">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a><span>/</span><a href="/pages/courses.html">Courses</a><span>/</span><span>${escapeHtml(course.name)}</span>
        </nav>
        <h1>${escapeHtml(course.name)}</h1>
        <p>${escapeHtml(course.shortDescription)}</p>
      </div>
    </section>

    <section class="section">
      <div class="container course-detail">
        <div class="course-detail__media media-frame media-frame--43" data-aos="fade-up">
          <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.name)}" width="1200" height="900" loading="eager">
        </div>
        <aside class="course-detail__aside" data-aos="fade-up">
          <p class="course-detail__aside-label">This programme</p>
          ${priceBlock}
          <p class="course-detail__classes"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${escapeHtml(course.classesLabel)}</p>
          <a href="${escapeHtml(course.cta.href)}" class="btn btn--primary btn--lg course-detail__book">${escapeHtml(course.cta.label)}</a>
          <a href="/pages/courses.html" class="btn btn--outline" style="margin-top:0.75rem">All courses</a>
        </aside>

        <div class="course-detail__main">
          <section class="course-section" data-aos="fade-up">
            <h2>${escapeHtml(course.phase.title)}</h2>
            <p>${escapeHtml(course.phase.body)}</p>
          </section>
          <section class="course-section" data-aos="fade-up">
            <h2>${escapeHtml(course.classesTiming.title)}</h2>
            <p>${escapeHtml(course.classesTiming.body)}</p>
          </section>
          <section class="course-section" data-aos="fade-up">
            <h2>${escapeHtml(course.whatYouLearn.title)}</h2>
            ${listHtml(course.whatYouLearn.items)}
          </section>
          <section class="course-section" data-aos="fade-up">
            <h2>${escapeHtml(course.goal.title)}</h2>
            <p>${escapeHtml(course.goal.body)}</p>
          </section>
          ${steps}
          ${doorstepWidget}
          <div class="blog-detail__cta" data-aos="fade-up">
            <a class="btn btn--primary btn--lg" href="${escapeHtml(course.cta.href)}">${escapeHtml(course.cta.label)}</a>
          </div>
        </div>
      </div>
    </section>
  </main>
  <div id="site-footer-mount"></div>
  <script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"></script>
  <script src="/js/layout.js"></script>
  <script src="/js/config.js"></script>
  <script src="/js/sanitize-html.js"></script>
  <script src="/js/app.js"></script>
  <script src="/js/doorstep-price.js"></script>
  <script src="/js/pages/course-detail.js"></script>
</body>
</html>`;
}

module.exports = { renderCourseHtml };
