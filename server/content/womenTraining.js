/**
 * Women's Training — Phase 5 content SSOT.
 * Used by: /women-training page, homepage empowerment section seeds, chatbot CTAs.
 *
 * Rules:
 * - Keep headline exactly: "Freedom Begins With Your First Ride"
 * - Only permitted statistic: "Around 70% of our candidates are women"
 * - Benefits are grounded in existing approved homepage/about copy (no invented claims)
 * - Gallery category: "Women Riders" via existing gallery CMS
 * - No separate women's course slug
 */
const config = require('../config');

const GALLERY_CATEGORY = 'Women Riders';

const WOMEN_TRAINING = {
  slug: 'women-training',
  legacySlugs: ['women-empowerment'],
  pageTitle: "Women's Training at Seekho 2 Wheeler",
  supportLine: 'A Comfortable Space to Learn, Practice & Ride With Confidence',
  homeHeadline: 'Freedom Begins With Your First Ride',
  homeEyebrow: 'Women Empowerment',
  intro:
    'Seekho was built for women who want independence — to commute, drop kids to school, and move through the city without waiting on anyone.',
  heroImage: '/images/courses/seekho-07.webp',
  gallery: {
    category: GALLERY_CATEGORY,
    title: 'Women Learning With Confidence',
    subtitle: "Real moments from our women's training sessions"
  },
  statistic: 'Around 70% of our candidates are women',
  finalCta: {
    heading: 'Ready to Start Your First Ride?',
    button: 'Book Ladies Training',
    href: '/pages/booking.html'
  },
  viewDetails: {
    label: 'View Details',
    href: '/women-training'
  },
  bookCta: {
    label: 'Book Ladies Training',
    href: '/pages/booking.html'
  },
  /**
   * Six line-icon benefits — titles/descriptions taken from existing approved
   * homepage women_l* / women_head / about.diff_women copy (not invented).
   */
  benefits: [
    {
      icon: 'fa-solid fa-venus',
      title: 'Female-friendly batches',
      text: 'Female-friendly batches with patient trainers in a supportive environment.'
    },
    {
      icon: 'fa-solid fa-person-rays',
      title: 'Learn from absolute zero',
      text: 'Non-cyclists learn from absolute zero — no prior riding experience required.'
    },
    {
      icon: 'fa-solid fa-road',
      title: 'Guided road practice',
      text: 'Guided road practice for real confidence on Kolkata roads.'
    },
    {
      icon: 'fa-solid fa-clock',
      title: 'Flexible training slots',
      text: 'Flexible morning and evening slots to fit around your day.'
    },
    {
      icon: 'fa-solid fa-shield-halved',
      title: 'Supportive environment',
      text: 'Dedicated ladies batches in a safe, supportive environment.'
    },
    {
      icon: 'fa-solid fa-heart',
      title: 'Built for independence',
      text: 'Made for women who want independence — to commute, drop kids to school, and move through the city without waiting on anyone.'
    }
  ],
  seo: {
    title: "Women's Training at Seekho 2 Wheeler",
    description:
      "Women's Training at Seekho 2 Wheeler — a comfortable space to learn, practice and ride with confidence. Around 70% of our candidates are women."
  }
};

function baseUrl() {
  return String(config.baseUrl || 'https://seekho2wheeler.vercel.app').replace(/\/$/, '');
}

function getWomenTraining() {
  return { ...WOMEN_TRAINING, benefits: WOMEN_TRAINING.benefits.map((b) => ({ ...b })) };
}

function breadcrumbJsonLd(base) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: "Women's Training",
        item: `${base}/women-training`
      }
    ]
  };
}

function webPageJsonLd(base) {
  const w = WOMEN_TRAINING;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: w.pageTitle,
    description: w.seo.description,
    url: `${base}/women-training`,
    isPartOf: { '@type': 'WebSite', name: 'Seekho Two Wheeler Academy', url: base }
  };
}

function chatbotWomenBlurb() {
  const w = WOMEN_TRAINING;
  return `${w.pageTitle}. ${w.supportLine}. ${w.intro} ${w.statistic}. Page: /women-training. Book: ${w.bookCta.href}`;
}

module.exports = {
  GALLERY_CATEGORY,
  WOMEN_TRAINING,
  getWomenTraining,
  baseUrl,
  breadcrumbJsonLd,
  webPageJsonLd,
  chatbotWomenBlurb
};
