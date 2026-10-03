/**
 * Customer-facing course catalog — single source of truth (Phase 4).
 * Exactly five courses. Reused by: course pages, listing, sitemap, chatbot, booking context.
 *
 * Rules:
 * - Do not invent prices, class counts, or guarantees.
 * - Doorstep pricing uses the existing Phase 1 calculator (not duplicated here).
 * - RTO: no “pass guaranteed” claims.
 * - Sheets/admin pricing may overlay live price/image when slugs match.
 */
const config = require('../config');
const { normalizeCourse } = require('../services/courses');

const COURSES = [
  {
    slug: 'basic-scooty',
    name: 'Basic Scooty',
    aliases: ['basic-scooty-training', 'scooty-training', 'scooty-basic', 'scooty'],
    pricingId: 'price-1',
    shortDescription:
      'Learn scooty riding from scratch — no cycle balancing required. Ideal for beginners.',
    classes: 15,
    classesLabel: '15 classes',
    priceFrom: 2500,
    priceLabel: 'From ₹2,500',
    showPrice: true,
    image: '/images/courses/seekho-01.webp',
    icon: 'fa-solid fa-scooter',
    sortOrder: 1,
    bookingSlug: 'basic-scooty',
    isDoorstep: false,
    seo: {
      title: 'Basic Scooty Training | Seekho',
      description:
        'Basic Scooty at Seekho — 15 classes from ₹2,500. Learn from scratch with theory, balance and petrol scooty practice in Kolkata.'
    },
    phase: {
      title: 'Phase',
      body:
        'Start from absolute basics. No cycle balancing is required. Training is designed for beginners, women, students and working professionals.'
    },
    classesTiming: {
      title: 'Classes / Timing',
      body: '15 classes. Flexible morning and evening slots — confirm your slot when you book.'
    },
    whatYouLearn: {
      title: 'What You Learn',
      items: [
        'Theory class',
        'Acceleration and brake control',
        'Balance and survival skills',
        'Turning and indicator practice',
        'Petrol scooty practice'
      ]
    },
    goal: {
      title: 'Goal',
      body:
        'Build foundational scooty control and confidence so you can start riding independently with guided practice.'
    },
    cta: { label: 'Book Basic Scooty', href: '/pages/booking.html?course=basic-scooty' }
  },
  {
    slug: 'advanced-scooty',
    name: 'Advanced Scooty',
    aliases: ['advanced-scooty-training', 'advance-scooty-training', 'advance-scooty'],
    pricingId: 'price-2',
    shortDescription:
      'For riders who know the basics and want confidence on busy roads.',
    classes: null,
    classesLabel: '10 or 15 classes',
    classesOptions: [10, 15],
    priceFrom: 2500,
    priceLabel: 'From ₹2,500',
    showPrice: true,
    image: '/images/courses/seekho-03.webp',
    icon: 'fa-solid fa-road',
    sortOrder: 2,
    bookingSlug: 'advanced-scooty',
    isDoorstep: false,
    seo: {
      title: 'Advanced Scooty Training | Seekho',
      description:
        'Advanced Scooty at Seekho — 10 or 15 classes for riders ready for busy roads, speed breakers and defensive riding in Kolkata.'
    },
    phase: {
      title: 'Phase',
      body:
        'Built for learners who already know scooty basics and want to gain confidence on busier roads.'
    },
    classesTiming: {
      title: 'Classes / Timing',
      body: '10 or 15 classes. Choose the option that fits your practice needs when you book or call.'
    },
    whatYouLearn: {
      title: 'What You Learn',
      items: [
        'Busy road practice',
        'Speed breaker handling',
        'Double carry riding',
        'Safe overtaking',
        'Defensive riding'
      ]
    },
    goal: {
      title: 'Goal',
      body:
        'Ride with greater confidence in real traffic conditions after you already know the basics.'
    },
    cta: { label: 'Book Advanced Scooty', href: '/pages/booking.html?course=advanced-scooty' }
  },
  {
    slug: 'bike-training',
    name: 'Bike Training',
    aliases: ['bike', 'motorcycle-training'],
    pricingId: 'price-3',
    shortDescription: 'Clutch, gear and road practice for motorcycle learners. Basic cycle balancing is required.',
    classes: 15,
    classesLabel: '15 classes',
    priceFrom: 2500,
    priceLabel: 'From ₹2,500',
    showPrice: true,
    image: '/images/courses/seekho-07.webp',
    icon: 'fa-solid fa-motorcycle',
    sortOrder: 3,
    bookingSlug: 'bike-training',
    isDoorstep: false,
    seo: {
      title: 'Bike Training Kolkata | Seekho',
      description:
        'Bike Training at Seekho — 15 classes covering clutch, gear control, busy road practice and RTO test preparation support.'
    },
    phase: {
      title: 'Phase',
      body:
        'Motorcycle training for learners who meet the basic cycle-balancing requirement and want structured bike practice.'
    },
    classesTiming: {
      title: 'Classes / Timing',
      body: '15 classes. Confirm branch and slot when you book.'
    },
    whatYouLearn: {
      title: 'What You Learn',
      items: [
        'Scooty mastery foundation where applicable',
        'Bike theory',
        'Clutch and gear control',
        'Busy road practice',
        'RTO test preparation support'
      ]
    },
    goal: {
      title: 'Goal',
      body: 'Develop controlled clutch/gear handling and road confidence on a motorcycle.'
    },
    cta: { label: 'Book Bike Training', href: '/pages/booking.html?course=bike-training' }
  },
  {
    slug: 'doorstep-training',
    name: 'Doorstep Training',
    aliases: [
      'doorstep-scooty-and-bike-training',
      'doorstep-scooty-training',
      'doorstep'
    ],
    pricingId: 'price-4',
    shortDescription:
      'Learn near your home. Available within 10 km of Netaji Metro Station. Price depends on distance.',
    classes: 15,
    classesLabel: '15-session standard package',
    priceFrom: null,
    priceLabel: 'Distance-based (calculator)',
    showPrice: false,
    image: '/images/courses/seekho-04.webp',
    icon: 'fa-solid fa-house-chimney',
    sortOrder: 4,
    bookingSlug: 'doorstep-training',
    isDoorstep: true,
    seo: {
      title: 'Doorstep Training | Seekho',
      description:
        'Doorstep Training from Seekho — learn near home within 10 km of Netaji Metro. Use the distance calculator for your estimate.'
    },
    phase: {
      title: 'Phase',
      body:
        'Personalised one-to-one training at your location. Learn scooty or bike near home instead of travelling to a centre first.'
    },
    classesTiming: {
      title: 'Classes / Timing',
      body:
        '15-session standard package with customisable duration and schedule. Confirm timing when you book.'
    },
    whatYouLearn: {
      title: 'What You Learn',
      items: [
        'Scooty and/or bike practice at your location',
        'Guided sessions with a personal trainer',
        'Schedule shaped around your neighbourhood routine'
      ]
    },
    goal: {
      title: 'Goal',
      body: 'Build riding confidence at home with a trainer who comes to you.'
    },
    steps: [
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
    cta: {
      label: 'Check Doorstep Price & Book',
      href: '/pages/booking.html?course=doorstep-training'
    }
  },
  {
    slug: 'rto-preparation',
    name: 'RTO Preparation',
    aliases: [
      'rto-license-and-exam-assistance',
      'rto-practice',
      'rto-exam-practice',
      'rto'
    ],
    pricingId: 'price-6',
    shortDescription: 'Practical preparation and guidance for the RTO driving test process.',
    classes: 3,
    classesLabel: '3 classes',
    priceFrom: 2800,
    priceLabel: 'From ₹2,800',
    showPrice: true,
    image: '/images/courses/seekho-06.webp',
    icon: 'fa-solid fa-clipboard-check',
    sortOrder: 5,
    bookingSlug: 'rto-preparation',
    isDoorstep: false,
    seo: {
      title: 'RTO Preparation | Seekho',
      description:
        'RTO Preparation at Seekho — practical riding preparation and license-process guidance. No pass guarantees.'
    },
    phase: {
      title: 'Phase',
      body:
        'Focused preparation support for learners who want guided practice related to the RTO driving test process.'
    },
    classesTiming: {
      title: 'Classes / Timing',
      body: '3 classes as listed for this programme. Confirm timing when you book.'
    },
    whatYouLearn: {
      title: 'What You Learn',
      items: [
        'Practical preparation for the RTO driving test context',
        'Riding confidence building for test-related practice',
        'License process assistance guidance'
      ]
    },
    goal: {
      title: 'Goal',
      body:
        'Help you prepare practically for the RTO process. Seekho does not guarantee that you will pass an RTO test.'
    },
    cta: { label: 'Book RTO Preparation', href: '/pages/booking.html?course=rto-preparation' }
  }
];

function baseUrl() {
  return String(config.baseUrl || 'https://seekho2wheeler.vercel.app').replace(/\/$/, '');
}

function listCourses() {
  return COURSES.map((c) => ({ ...c }));
}

function getCourse(slugOrAlias) {
  const key = String(slugOrAlias || '')
    .trim()
    .toLowerCase();
  if (!key) return null;
  return (
    COURSES.find((c) => c.slug === key) ||
    COURSES.find((c) => (c.aliases || []).includes(key)) ||
    null
  );
}

function resolveSlug(slugOrAlias) {
  const c = getCourse(slugOrAlias);
  return c ? c.slug : null;
}

function coursePaths() {
  return COURSES.map((c) => `/courses/${c.slug}`);
}

function matchesPricingRow(course, row) {
  const n = normalizeCourse(row);
  if (!n) return false;
  if (course.pricingId && String(n.id) === String(course.pricingId)) return true;
  const slug = String(n.slug || '').toLowerCase();
  if (slug && (slug === course.slug || (course.aliases || []).includes(slug))) return true;
  const name = String(n.name || n.courseName || '').toLowerCase();
  if (name && name.includes(course.name.toLowerCase())) return true;
  return false;
}

function overlayFromPricing(course, pricingRows) {
  const rows = (pricingRows || []).map(normalizeCourse).filter(Boolean);
  const match = rows.find((r) => matchesPricingRow(course, r) && r.is_active !== false);
  if (!match) return { ...course };

  const merged = { ...course };
  if (match.image_url) merged.image = match.image_url;
  if (match.description && String(match.description).trim()) {
    merged.shortDescription = String(match.description).replace(/\s+/g, ' ').trim();
  }
  if (Number.isFinite(match.price) && match.price > 0 && !course.isDoorstep) {
    merged.priceFrom = match.price;
    merged.priceLabel = `From ₹${Number(match.price).toLocaleString('en-IN')}`;
    merged.showPrice = true;
  }
  if (course.classesOptions) {
    merged.classesLabel = course.classesLabel;
  } else if (Number.isFinite(match.classes) && match.classes >= 1) {
    merged.classes = match.classes;
    merged.classesLabel = `${match.classes} classes`;
  }
  merged.pricingRecord = {
    id: match.id,
    slug: match.slug,
    name: match.name,
    price: match.price
  };
  return merged;
}

function publicCard(course) {
  return {
    id: course.pricingId || course.slug,
    slug: course.slug,
    name: course.name,
    courseName: course.name,
    description: course.shortDescription,
    shortDescription: course.shortDescription,
    classes: course.classes,
    classes_label: course.classesLabel,
    classesLabel: course.classesLabel,
    price: course.showPrice && course.priceFrom != null ? course.priceFrom : null,
    priceLabel: course.priceLabel,
    showPrice: !!course.showPrice,
    image: course.image,
    image_url: course.image,
    icon: course.icon,
    sort_order: course.sortOrder,
    displayOrder: course.sortOrder,
    isDoorstep: !!course.isDoorstep,
    bookingSlug: course.bookingSlug || course.slug,
    cta: course.cta,
    detailPath: `/courses/${course.slug}`
  };
}

function listPublicCards(pricingRows) {
  return COURSES.map((c) => publicCard(overlayFromPricing(c, pricingRows))).sort(
    (a, b) => a.sort_order - b.sort_order
  );
}

function getPublicCourse(slugOrAlias, pricingRows) {
  const base = getCourse(slugOrAlias);
  if (!base) return null;
  return overlayFromPricing(base, pricingRows);
}

function chatbotCourseList() {
  return COURSES.map((c) => c.name).join(', ');
}

function chatbotCourseDetail(slugOrAlias) {
  const c = getCourse(slugOrAlias);
  if (!c) return '';
  const price = c.isDoorstep
    ? 'distance-based (use doorstep calculator)'
    : c.priceLabel || (c.priceFrom != null ? `From ₹${c.priceFrom}` : 'not specified');
  const learn = (c.whatYouLearn?.items || []).join('; ');
  return `${c.name}. Classes: ${c.classesLabel}. Price: ${price}. What you learn: ${learn}. Goal: ${c.goal?.body || ''}. Details: /courses/${c.slug}`;
}

function courseJsonLd(course, base) {
  const url = `${base}/courses/${course.slug}`;
  const node = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.seo?.description || course.shortDescription,
    url,
    provider: {
      '@type': 'Organization',
      name: 'Seekho Two Wheeler Academy',
      url: base
    }
  };
  if (course.showPrice && course.priceFrom != null) {
    node.offers = {
      '@type': 'Offer',
      price: course.priceFrom,
      priceCurrency: 'INR',
      url
    };
  }
  return node;
}

function breadcrumbJsonLd(course, base) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Courses', item: `${base}/pages/courses.html` },
      {
        '@type': 'ListItem',
        position: 3,
        name: course.name,
        item: `${base}/courses/${course.slug}`
      }
    ]
  };
}

/** Seed rows for local/Sheets pricing aligned to the five-course catalog. */
function pricingSeedRows(now = new Date().toISOString()) {
  return COURSES.map((c) => ({
    id: c.pricingId,
    name: c.name,
    courseName: c.name,
    slug: c.slug,
    description: c.shortDescription,
    price: c.isDoorstep ? 4500 : c.priceFrom != null ? c.priceFrom : 0,
    classes: c.classesOptions ? 15 : c.classes || 1,
    image_url: c.image,
    image: c.image,
    features: c.whatYouLearn?.items || [],
    badge: '',
    is_active: true,
    active: true,
    sort_order: c.sortOrder,
    displayOrder: c.sortOrder,
    title_bold: false,
    created_at: now,
    updated_at: now,
    createdAt: now,
    updatedAt: now
  }));
}

module.exports = {
  COURSES,
  listCourses,
  getCourse,
  resolveSlug,
  coursePaths,
  listPublicCards,
  getPublicCourse,
  publicCard,
  chatbotCourseList,
  chatbotCourseDetail,
  courseJsonLd,
  breadcrumbJsonLd,
  baseUrl,
  pricingSeedRows,
  overlayFromPricing
};
