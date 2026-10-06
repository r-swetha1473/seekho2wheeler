/**
 * Riding Tips & Insights — blog article SSOT (Phase 6).
 *
 * Exactly six customer-facing articles. Used by:
 * - /api/blogs (+ detail merge)
 * - homepage Riding Tips section
 * - sync-content upsert (by slug)
 * - Article 6 branch sections from locations.js (not duplicated here)
 *
 * Content rules:
 * - Preserve existing article slugs 1–3.
 * - Article 6 title/slug fixed; branch facts come from locations.js.
 * - Articles 4–5 restate approved course SSOT facts only (no invented prices/guarantees).
 * - Do not invent ratings, learner counts, or review claims.
 */
const config = require('../config');
const { listLocations } = require('./locations');

const BOOK_CTA = {
  heading: 'Ready to start your riding journey?',
  label: 'Book Training Now',
  href: '/pages/booking.html'
};

const ARTICLES = [
  {
    id: 'blog-1',
    slug: 'how-to-learn-scooty-without-knowing-cycle',
    title: 'How to Learn Scooty Without Knowing Cycle',
    category: 'Beginner Tips',
    featuredImage: '/images/blogs/seekho-01.webp',
    shortDescription:
      'Non-cyclists can learn scooty riding safely with balance drills, slow control and gradual traffic exposure.',
    metaTitle: 'Learn Scooty Without Cycle | Seekho Academy Kolkata',
    metaDescription:
      'Non-cyclists can learn scooty riding safely. Step-by-step tips from Seekho Two Wheeler Academy trainers in Kolkata.',
    publishedAt: '2026-07-22T08:32:31.249Z',
    galleryCategory: 'Scooty Training',
    sortOrder: 1,
    intro:
      'Many students believe they must know cycling before learning scooty. At Seekho, that is not true. Our trainers start with balance drills, slow control, and gradual traffic exposure — designed especially for non-cyclists and women beginners.',
    sections: [
      {
        title: 'You do not need cycle experience',
        body:
          'Basic Scooty training at Seekho starts from absolute basics. No cycle balancing is required. Training is designed for beginners, women, students and working professionals.'
      },
      {
        title: 'Start with balance and slow control',
        body:
          'Trainers begin with balance drills and slow control so you build confidence before facing busy roads.'
      },
      {
        title: 'Learn core scooty controls',
        body:
          'Sessions cover theory, acceleration and brake control, turning and indicator practice, plus petrol scooty practice.'
      },
      {
        title: 'Move to guided road practice',
        body:
          'After basic control, trainers take students for guided real-traffic practice so you become road-ready.'
      }
    ],
    takeaways: [
      'Cycle balancing is not required for Basic Scooty at Seekho.',
      'Training starts with balance drills and slow control.',
      'Guided road practice follows once basic control is in place.',
      'Non-cyclists and women beginners are welcome.'
    ],
    cta: { ...BOOK_CTA, href: '/pages/booking.html?course=basic-scooty' }
  },
  {
    id: 'blog-2',
    slug: 'how-to-learn-scooty-fast',
    title: 'How to Learn Scooty Fast',
    category: 'Beginner Tips',
    featuredImage: '/images/blogs/seekho-02.webp',
    shortDescription:
      'Consistency beats intensity — short, focused sessions with a professional trainer help you progress faster.',
    metaTitle: 'How to Learn Scooty Fast | Seekho Two Wheeler Academy',
    metaDescription:
      'Practical tips to learn scooty riding faster with professional training in Kolkata.',
    publishedAt: '2026-07-22T08:32:31.249Z',
    galleryCategory: 'Scooty Training',
    sortOrder: 2,
    intro:
      'Consistency beats intensity. Short, focused sessions with a professional trainer help you progress faster than irregular long practice alone.',
    sections: [
      {
        title: 'Book a structured class plan',
        body:
          'Basic Scooty is a 15-class programme. Advanced Scooty offers 10 or 15 classes for riders who already know the basics.'
      },
      {
        title: 'Use flexible morning or evening slots',
        body:
          'Flexible morning and evening slots help you stay consistent — confirm your slot when you book.'
      },
      {
        title: 'Master controls before busy roads',
        body:
          'Build acceleration, brake, balance, turning and indicator skills first, then move into busier road practice.'
      },
      {
        title: 'Level up when basics feel solid',
        body:
          'Advanced Scooty covers busy road practice, speed breaker handling, double carry riding, safe overtaking and defensive riding.'
      }
    ],
    takeaways: [
      'Short, focused sessions with a trainer beat irregular practice.',
      'Basic Scooty is 15 classes; Advanced Scooty offers 10 or 15 classes.',
      'Flexible morning and evening slots support consistency.',
      'Busy-road skills come after basic control is secure.'
    ],
    cta: { ...BOOK_CTA, href: '/pages/booking.html?course=basic-scooty' }
  },
  {
    id: 'blog-3',
    slug: 'why-women-should-learn-two-wheeler-riding',
    title: 'Why Women Should Learn Two Wheeler Riding',
    category: 'Women Riders',
    featuredImage: '/images/blogs/seekho-07.webp',
    shortDescription:
      'Riding builds independence, confidence and freedom — Seekho offers a female-friendly environment for women across Kolkata.',
    metaTitle: 'Women Two Wheeler Training Kolkata | Seekho Academy',
    metaDescription:
      'Riding builds independence, confidence and freedom. Discover why women across Kolkata choose Seekho.',
    publishedAt: '2026-07-22T08:32:31.249Z',
    galleryCategory: 'Women Riders',
    sortOrder: 3,
    intro:
      'Learning to ride is more than a skill — it is independence. Seekho provides a female-friendly environment so every woman can ride without fear. Seekho was built for women who want independence — to commute, drop kids to school, and move through the city without waiting on anyone.',
    sections: [
      {
        title: 'Independence on your own schedule',
        body:
          'Riding helps you commute, drop kids to school, and move through Kolkata without waiting on anyone.'
      },
      {
        title: 'Female-friendly batches',
        body:
          'Female-friendly batches with patient trainers in a supportive environment help women start with confidence.'
      },
      {
        title: 'Learn from absolute zero',
        body:
          'Non-cyclists learn from absolute zero — no prior riding experience is required for Basic Scooty.'
      },
      {
        title: 'Guided practice and flexible slots',
        body:
          'Guided road practice builds real confidence on Kolkata roads. Flexible morning and evening slots fit around your day.'
      }
    ],
    takeaways: [
      'Around 70% of our candidates are women.',
      'Female-friendly batches and patient trainers are available.',
      'Non-cyclists can start from absolute zero.',
      'Book Ladies Training through the regular booking flow.'
    ],
    cta: {
      heading: 'Ready to Start Your First Ride?',
      label: 'Book Ladies Training',
      href: '/pages/booking.html'
    }
  },
  {
    id: 'blog-4',
    slug: 'how-doorstep-training-works',
    title: 'How Doorstep Training Works',
    category: 'Doorstep Training',
    featuredImage: '/images/courses/seekho-04.webp',
    shortDescription:
      'Learn scooty or bike near home within 10 km of Netaji Metro — personal trainer, 15-session package, distance-based price.',
    metaTitle: 'How Doorstep Training Works | Seekho Two Wheeler Academy',
    metaDescription:
      'Doorstep Training from Seekho — learn near home within 10 km of Netaji Metro. Use the distance calculator for your estimate.',
    publishedAt: '2026-10-03T10:00:00.000Z',
    galleryCategory: 'Scooty Training',
    sortOrder: 4,
    intro:
      'Doorstep Training is personalised one-to-one training at your location. Learn scooty or bike near home instead of travelling to a centre first. It is available within 10 km of Netaji Metro Station. Price depends on distance — use the doorstep calculator when you book.',
    sections: [
      {
        title: 'Step 1 — Learn near home',
        body: 'Doorstep training is available within 10 km of Netaji Metro Station.'
      },
      {
        title: 'Step 2 — Check your price',
        body:
          'Use the existing doorstep calculator: up to 3 km → ₹4,500; each extra km (rounded up) → +₹500; maximum ₹8,000; above 10 km → unavailable.'
      },
      {
        title: 'Step 3 — Scooty or bike',
        body: 'Doorstep sessions cover scooty and bike training options as arranged with your trainer.'
      },
      {
        title: 'Step 4 — Personal trainer',
        body: 'A personal trainer comes to your location for one-to-one guidance.'
      },
      {
        title: 'Step 5 — Standard package',
        body: 'The standard package is a 15-session training plan.'
      },
      {
        title: 'Step 6 — Customise & book',
        body:
          'Duration and schedule can be customised. Book online or call the official Seekho numbers to confirm.'
      }
    ],
    takeaways: [
      'Available within 10 km of Netaji Metro Station.',
      'Price is distance-based via the doorstep calculator (max ₹8,000).',
      'Personal trainer, one-to-one sessions.',
      'Standard package is 15 sessions; schedule can be customised.'
    ],
    cta: {
      heading: 'Ready to train near home?',
      label: 'Check Doorstep Price & Book',
      href: '/pages/booking.html?course=doorstep-training'
    }
  },
  {
    id: 'blog-5',
    slug: 'bike-training-for-beginners',
    title: 'Bike Training for Beginners',
    category: 'Bike Training',
    featuredImage: '/images/courses/seekho-07.webp',
    shortDescription:
      'Clutch, gear and road practice for motorcycle learners — basic cycle balancing is required before you start.',
    metaTitle: 'Bike Training for Beginners | Seekho Two Wheeler Academy',
    metaDescription:
      'Bike Training at Seekho — 15 classes covering clutch, gear control, busy road practice and RTO test preparation support.',
    publishedAt: '2026-10-03T10:05:00.000Z',
    galleryCategory: 'Bike Training',
    sortOrder: 5,
    intro:
      'Bike Training is motorcycle training for learners who meet the basic cycle-balancing requirement and want structured bike practice. The programme is 15 classes covering clutch, gear control, busy road practice and RTO test preparation support.',
    sections: [
      {
        title: 'Check the cycle-balancing requirement',
        body:
          'Basic cycle balancing is required before bike training. If you are starting from absolute zero without cycle balance, begin with Basic Scooty first.'
      },
      {
        title: 'Build a scooty foundation where applicable',
        body: 'Training includes scooty mastery foundation where applicable, then bike theory.'
      },
      {
        title: 'Master clutch and gear control',
        body: 'Focused practice on clutch and gear control helps you ride a motorcycle with control.'
      },
      {
        title: 'Practise on busy roads',
        body: 'Busy road practice develops road confidence after clutch and gear basics are in place.'
      },
      {
        title: 'RTO preparation support',
        body:
          'Bike Training includes RTO test preparation support. Separate RTO Preparation (3 classes) is also available for focused test-related practice. Seekho does not guarantee that you will pass an RTO test.'
      }
    ],
    takeaways: [
      'Basic cycle balancing is required for Bike Training.',
      'Programme is 15 classes covering clutch, gear and road practice.',
      'RTO test preparation support is included; no pass guarantee.',
      'Confirm branch and slot when you book.'
    ],
    cta: { ...BOOK_CTA, href: '/pages/booking.html?course=bike-training', label: 'Book Bike Training' }
  },
  {
    id: 'blog-6',
    slug: 'our-training-centres-across-kolkata',
    title: 'Our Training Centres Across Kolkata',
    category: 'Branches',
    featuredImage: '/images/banners/seekho-01.webp',
    shortDescription:
      'Seven Seekho centres across Kolkata — Tollygunge, Barasat, New Town, Sodepur, Rabindra Sarobar, Howrah and Patuli.',
    metaTitle: 'Our Training Centres Across Kolkata | Seekho Academy',
    metaDescription:
      'Find Seekho Two Wheeler Academy centres across Kolkata — seven branches with maps, training options and galleries.',
    publishedAt: '2026-10-03T10:10:00.000Z',
    galleryCategory: 'Branch Activities',
    sortOrder: 6,
    articleType: 'branches',
    intro:
      'Seekho Two Wheeler Academy trains learners across seven centres in Kolkata. Expand each branch below for location details, training available at that centre, maps and the branch gallery.',
    sections: [],
    takeaways: [
      'Seven centres: Tollygunge, Barasat, New Town, Sodepur, Rabindra Sarobar, Howrah and Patuli.',
      'Tollygunge is the main branch (established 2018).',
      'Barasat landmark: Lalit Cinema.',
      'Rabindra Sarobar landmark: Swiss Park, opposite Bhawani Cinema.',
      'Branch facts stay in sync with the location pages — book or call to confirm course availability.'
    ],
    cta: { ...BOOK_CTA, href: '/pages/branches.html', label: 'View All Branches', heading: 'Find a centre near you' }
  }
];

function baseUrl() {
  return String(config.baseUrl || 'https://seekho2wheeler.vercel.app').replace(/\/$/, '');
}

function listArticles() {
  return ARTICLES.map((a) => ({ ...a }));
}

function getArticle(slug) {
  const found = ARTICLES.find((a) => a.slug === slug);
  return found ? { ...found } : null;
}

function articlePaths() {
  return ARTICLES.map((a) => `/blog/${a.slug}`);
}

/** Seed / sync rows for blogs sheet (CMS fields). Never deletes unrelated rows. */
function blogSeedRows(now = new Date().toISOString()) {
  return ARTICLES.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    featuredImage: a.featuredImage,
    metaTitle: a.metaTitle,
    metaDescription: a.metaDescription,
    content: buildContentHtml(a),
    shortDescription: a.shortDescription,
    category: a.category,
    galleryCategory: a.galleryCategory || '',
    status: 'published',
    scheduledAt: null,
    publishedAt: a.publishedAt || now,
    title_bold: false,
    createdAt: a.publishedAt || now,
    updatedAt: now
  }));
}

function buildContentHtml(article) {
  const parts = [`<p>${escapeHtml(article.intro)}</p>`];
  (article.sections || []).forEach((s, i) => {
    parts.push(`<h3>${i + 1}. ${escapeHtml(s.title)}</h3><p>${escapeHtml(s.body)}</p>`);
  });
  if (article.takeaways && article.takeaways.length) {
    parts.push('<h3>Key Takeaways</h3><ul>');
    article.takeaways.forEach((t) => {
      parts.push(`<li>${escapeHtml(t)}</li>`);
    });
    parts.push('</ul>');
  }
  return parts.join('');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Merge CMS/Sheets row with SSOT structure.
 * CMS wins for title/image/meta/content edits; SSOT supplies structure when present.
 */
function mergeArticle(row) {
  if (!row || !row.slug) return row;
  const ssot = getArticle(row.slug);
  if (!ssot) {
    return {
      ...row,
      shortDescription: row.shortDescription || row.metaDescription || '',
      category: row.category || 'Riding Tips',
      sections: [],
      takeaways: [],
      galleryCategory: row.galleryCategory || '',
      cta: { ...BOOK_CTA },
      articleType: 'standard'
    };
  }

  const cta = {
    heading: (ssot.cta && ssot.cta.heading) || BOOK_CTA.heading,
    label: (ssot.cta && ssot.cta.label) || BOOK_CTA.label,
    href: (ssot.cta && ssot.cta.href) || BOOK_CTA.href
  };

  const merged = {
    ...ssot,
    ...row,
    id: row.id || ssot.id,
    title: row.title || ssot.title,
    slug: row.slug,
    featuredImage: row.featuredImage || ssot.featuredImage,
    metaTitle: row.metaTitle || ssot.metaTitle,
    metaDescription: row.metaDescription || ssot.metaDescription,
    content: row.content || buildContentHtml(ssot),
    shortDescription: row.shortDescription || ssot.shortDescription || row.metaDescription || '',
    category: row.category || ssot.category,
    galleryCategory: row.galleryCategory || ssot.galleryCategory || '',
    status: row.status || 'published',
    publishedAt: row.publishedAt || ssot.publishedAt,
    sections: ssot.sections || [],
    takeaways: ssot.takeaways || [],
    cta,
    articleType: ssot.articleType || 'standard',
    intro: ssot.intro
  };

  if (merged.articleType === 'branches') {
    let source = listLocations();
    try {
      const cached = require('../services/locationCms').getCachedCards();
      if (cached && cached.length) {
        source = cached.map((card) => ({
          slug: card.slug,
          displayName: card.name,
          name: card.name,
          branchName: card.branchName,
          area: card.area,
          landmark: card.landmark,
          address: card.address,
          howToReach: card.howToReach || [],
          trainingAvailable: card.trainingAvailable || [],
          mapsLink: card.mapsLink,
          phones: card.phones || [],
          whatsapp: card.whatsapp,
          galleryCategory: card.galleryCategory,
          isMainBranch: card.isMainBranch,
          establishedLabel: card.establishedLabel
        }));
      }
    } catch { /* static locations.js */ }
    merged.branches = source.map((loc) => ({
      slug: loc.slug,
      name: loc.displayName || loc.name,
      branchName: loc.branchName,
      area: loc.area,
      landmark: loc.landmark || '',
      address: loc.address,
      howToReach: loc.howToReach || [],
      trainingAvailable: loc.trainingAvailable || [],
      mapsLink: loc.mapsLink || '',
      embedUrl: loc.embedUrl || '',
      phones: loc.phones || [],
      whatsapp: loc.whatsapp || '',
      galleryCategory: loc.galleryCategory,
      href: `/locations/${loc.slug}`,
      isMainBranch: !!loc.isMainBranch,
      establishedLabel: loc.establishedLabel || ''
    }));
  }

  return merged;
}

function mergePublicList(rows) {
  const bySlug = new Map((rows || []).map((r) => [r.slug, r]));
  const ordered = ARTICLES.map((a) => {
    const row = bySlug.get(a.slug);
    return mergeArticle(row || blogSeedRows()[ARTICLES.indexOf(a)]);
  });
  // Include any extra CMS posts after the six (do not delete/hide unrelated)
  const known = new Set(ARTICLES.map((a) => a.slug));
  const extras = (rows || [])
    .filter((r) => r && r.slug && !known.has(r.slug) && r.status !== 'draft' && r.status !== 'archived')
    .map((r) => mergeArticle(r));
  return [...ordered, ...extras];
}

module.exports = {
  ARTICLES,
  BOOK_CTA,
  listArticles,
  getArticle,
  articlePaths,
  blogSeedRows,
  buildContentHtml,
  mergeArticle,
  mergePublicList,
  baseUrl
};
