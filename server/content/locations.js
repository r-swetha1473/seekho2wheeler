/**
 * Location / branch pages — single source of truth (Phase 3).
 * Reused by: location HTML routes, sitemap, chatbot, homepage/branches cards, blog refs.
 *
 * Rules:
 * - Only Tollygunge uses Main Branch Place ID.
 * - Do not invent Place IDs, prices, hours, or facilities.
 * - Barasat landmark: "Lalit Cinema" (confirmed).
 * - Rabindra Sarobar landmark: "Swiss Park, opposite Bhawani Cinema" (confirmed).
 * - Training lists come from supported branch course data (not copied blindly across branches).
 */
const { MAIN_BRANCH, mapsSearchUrl, mapsEmbedUrl, postalAddress } = require('../config/mainBranch');
const config = require('../config');

const OFFICIAL_PHONES = ['9748481630', '7980108587'];

/** @typedef {import('../config/mainBranch')} */

const LOCATIONS = [
  {
    slug: 'tollygunge',
    name: 'Tollygunge',
    displayName: 'Tollygunge',
    branchName: 'Tollygunge Branch',
    isMainBranch: true,
    established: '2018',
    establishedLabel: 'Established 2018',
    area: 'Tollygunge',
    landmark: 'Paschim Putiary / near Metro',
    howToReach: [
      'Our main centre is at Paschim Putiary, Haridevpur (Tollygunge area).',
      'Look for the area near the local Metro access and Paschim Putiary post office landmark.',
      'Full address: 1, 78, Banerjee Para Rd, Haridevpur, Paschim Putiary, Kolkata, West Bengal 700041, India.'
    ],
    address: MAIN_BRANCH.formattedAddress,
    streetAddress: MAIN_BRANCH.streetAddress,
    addressLocality: MAIN_BRANCH.addressLocality,
    addressRegion: MAIN_BRANCH.addressRegion,
    postalCode: MAIN_BRANCH.postalCode,
    placeId: MAIN_BRANCH.placeId,
    mapsLink: mapsSearchUrl(MAIN_BRANCH),
    embedUrl: mapsEmbedUrl(MAIN_BRANCH),
    phones: [...OFFICIAL_PHONES],
    whatsapp: OFFICIAL_PHONES[0],
    trainingAvailable: [
      'Basic Scooty Training',
      'Advance Scooty Training',
      'Bike Training',
      'Doorstep Scooty Training',
      'RTO Exam Practice'
    ],
    galleryCategory: 'Branch: Tollygunge',
    seo: {
      title: 'Scooty Bike Training Tollygunge | Seekho',
      description:
        'Learn scooty and bike riding at Seekho Tollygunge — our main Kolkata centre since 2018. Book training near Paschim Putiary.',
      keywords: [
        'scooty training Tollygunge',
        'bike training Paschim Putiary',
        'two wheeler training Kolkata main branch'
      ]
    },
    hero: {
      h1: 'Scooty & Bike Training in Tollygunge',
      eyebrow: 'Main Branch · Since 2018',
      subtitle:
        'Seekho’s first and main centre in Kolkata — established in 2018 at Paschim Putiary, Haridevpur.'
    },
    why: {
      title: 'Why Train at Tollygunge',
      body:
        'Tollygunge is our original Seekho centre — the first branch, opened in 2018. It remains the main hub for scooty, bike, doorstep and RTO practice training.'
    },
    usps: [
      { icon: 'fa-solid fa-flag', title: 'First Seekho Centre', text: 'Opened in 2018 as our founding Kolkata branch.' },
      { icon: 'fa-solid fa-location-dot', title: 'Main Branch Address', text: 'Paschim Putiary, Haridevpur — full mapped Google Place listing.' },
      { icon: 'fa-solid fa-motorcycle', title: 'Full Training Range', text: 'Scooty, bike, doorstep scooty training and RTO exam practice are offered here.' },
      { icon: 'fa-solid fa-people-group', title: 'Women Learning Welcome', text: 'Ladies and beginners train in a supportive environment.' }
    ],
    whoCanLearn: [
      'Beginners starting scooty or bike for the first time',
      'Learners who want doorstep scooty training arranged from this centre',
      'Candidates preparing for RTO exam practice',
      'Women and families looking for patient, guided training'
    ],
    women: {
      title: 'Women Learning at Tollygunge',
      body:
        'Women learners are welcome at our Tollygunge centre. Book ladies-focused training through our regular booking flow.'
    },
    faqs: [
      {
        q: 'When was the Tollygunge branch established?',
        a: 'Tollygunge is Seekho’s first and main branch, established in 2018.'
      },
      {
        q: 'What is the Tollygunge centre address?',
        a: '1, 78, Banerjee Para Rd, Haridevpur, Paschim Putiary, Kolkata, West Bengal 700041, India.'
      },
      {
        q: 'Which training is available at Tollygunge?',
        a: 'Basic Scooty Training, Advance Scooty Training, Bike Training, Doorstep Scooty Training and RTO Exam Practice.'
      },
      {
        q: 'How do I book at the main branch?',
        a: 'Use Register & Book on the website, or call / WhatsApp 9748481630 or 7980108587.'
      }
    ],
    showFloatingReviews: false
  },
  {
    slug: 'barasat',
    name: 'Barasat',
    displayName: 'Barasat',
    branchName: 'Barasat Branch',
    isMainBranch: false,
    established: '2024',
    establishedLabel: 'Established 2024',
    area: 'Barasat',
    landmark: 'Lalit Cinema',
    howToReach: [
      'Find us near Barasat Station (platform area reference used by the centre).',
      'Landmark: Lalit Cinema.',
      'Ask for Seekho Two Wheeler training near Lalit Cinema, Barasat.'
    ],
    address: 'Near Barasat Station, landmark Lalit Cinema, Barasat, North 24 Parganas, Kolkata',
    mapsLink: 'https://maps.google.com/?q=Barasat+Lalit+Cinema+Kolkata',
    phones: [...OFFICIAL_PHONES],
    whatsapp: OFFICIAL_PHONES[1],
    trainingAvailable: [
      'Basic Scooty Training',
      'Advance Scooty Training',
      'Bike Training',
      'RTO Exam Practice'
    ],
    galleryCategory: 'Branch: Barasat',
    seo: {
      title: 'Scooty Bike Training Barasat | Seekho',
      description:
        'Seekho Barasat branch (est. 2024) near Lalit Cinema and Barasat Station. Scooty, bike and RTO practice training.',
      keywords: ['scooty training Barasat', 'bike training Lalit Cinema', 'two wheeler training Barasat Station']
    },
    hero: {
      h1: 'Scooty & Bike Training in Barasat',
      eyebrow: 'North Kolkata · Est. 2024',
      subtitle: 'Train near Barasat Station with the landmark Lalit Cinema — Seekho’s Barasat centre since 2024.'
    },
    why: {
      title: 'Why Train at Barasat',
      body:
        'Opened in 2024 to serve North 24 Parganas learners. The centre is easy to find near Barasat Station with Lalit Cinema as the landmark.'
    },
    usps: [
      { icon: 'fa-solid fa-train', title: 'Near Barasat Station', text: 'Convenient for learners travelling via the station area.' },
      { icon: 'fa-solid fa-signs-post', title: 'Landmark: Lalit Cinema', text: 'Ask locally for Lalit Cinema to reach the Barasat centre.' },
      { icon: 'fa-solid fa-calendar', title: 'Established 2024', text: 'A newer Seekho branch serving Barasat and nearby areas.' },
      { icon: 'fa-solid fa-clipboard-check', title: 'RTO Practice Offered', text: 'Scooty, bike and RTO exam practice are available here.' }
    ],
    whoCanLearn: [
      'Beginners in and around Barasat',
      'Learners who prefer a North Kolkata / Barasat centre',
      'Candidates preparing for RTO exam practice',
      'Women starting scooty or bike training'
    ],
    women: {
      title: 'Women Learning at Barasat',
      body: 'Women learners can book scooty or bike training at the Barasat centre near Lalit Cinema.'
    },
    faqs: [
      {
        q: 'Where is the Barasat branch located?',
        a: 'Near Barasat Station. The landmark is Lalit Cinema.'
      },
      {
        q: 'When did Seekho open in Barasat?',
        a: 'The Barasat branch was established in 2024.'
      },
      {
        q: 'What training is available in Barasat?',
        a: 'Basic Scooty Training, Advance Scooty Training, Bike Training and RTO Exam Practice.'
      },
      {
        q: 'How do I contact the Barasat centre?',
        a: 'Call or WhatsApp 9748481630 or 7980108587, or book online.'
      }
    ],
    showFloatingReviews: false
  },
  {
    slug: 'new-town',
    name: 'New Town',
    displayName: 'New Town',
    branchName: 'New Town Branch',
    isMainBranch: false,
    established: 'September 2025',
    establishedLabel: 'Established September 2025',
    area: 'New Town',
    landmark: 'Biswa Bangla Gate / Snehodiya',
    howToReach: [
      'Located around Biswa Bangla Gate / Snehodiya in New Town.',
      'Area reference: Action Area, BC Block.',
      'Ask for Seekho scooty training near Biswa Bangla Gate.'
    ],
    address: 'Around Biswa Bangla Gate / Snehodiya, Action Area BC Block, New Town, Kolkata',
    mapsLink: 'https://maps.google.com/?q=Biswa+Bangla+Gate+New+Town+Kolkata',
    phones: [...OFFICIAL_PHONES],
    whatsapp: OFFICIAL_PHONES[1],
    trainingAvailable: ['Basic Scooty Training', 'Advance Scooty Training'],
    galleryCategory: 'Branch: New Town',
    seo: {
      title: 'Scooty Training New Town | Seekho',
      description:
        'Seekho New Town branch (est. September 2025) around Biswa Bangla Gate / Snehodiya. Basic and advance scooty training.',
      keywords: ['scooty training New Town', 'Biswa Bangla Gate training', 'Snehodiya scooty class']
    },
    hero: {
      h1: 'Scooty Training in New Town',
      eyebrow: 'New Town · Est. September 2025',
      subtitle: 'Learn near Biswa Bangla Gate / Snehodiya — Seekho’s New Town centre opened in September 2025.'
    },
    why: {
      title: 'Why Train at New Town',
      body:
        'Opened in September 2025 for New Town learners. The centre is around Biswa Bangla Gate / Snehodiya (Action Area, BC Block).'
    },
    usps: [
      { icon: 'fa-solid fa-city', title: 'New Town Location', text: 'Serves Action Area learners around Biswa Bangla Gate / Snehodiya.' },
      { icon: 'fa-solid fa-calendar-plus', title: 'Opened September 2025', text: 'One of Seekho’s newer Kolkata centres.' },
      { icon: 'fa-solid fa-scooter', title: 'Scooty Focus', text: 'Basic and Advance Scooty Training are offered at this branch.' },
      { icon: 'fa-solid fa-star', title: 'Learner Feedback', text: 'See Google reviews linked from this page for recent learner feedback.' }
    ],
    whoCanLearn: [
      'Beginners in New Town and nearby Action Area',
      'Learners specifically looking for scooty training',
      'Women starting their first scooty classes',
      'Residents near Biswa Bangla Gate / Snehodiya'
    ],
    women: {
      title: 'Women Learning at New Town',
      body: 'Women are welcome to book Basic or Advance Scooty Training at the New Town centre.'
    },
    faqs: [
      {
        q: 'Where is the New Town branch?',
        a: 'Around Biswa Bangla Gate / Snehodiya in New Town (Action Area, BC Block).'
      },
      {
        q: 'When did the New Town centre open?',
        a: 'It was established in September 2025.'
      },
      {
        q: 'Which courses are available in New Town?',
        a: 'Basic Scooty Training and Advance Scooty Training.'
      },
      {
        q: 'Can I read learner feedback for New Town?',
        a: 'Yes. Use the Google reviews link on this page (from our configured Google Business / maps destination).'
      }
    ],
    showFloatingReviews: true
  },
  {
    slug: 'sodepur',
    name: 'Sodepur',
    displayName: 'Sodepur',
    branchName: 'Sodepur Branch',
    isMainBranch: false,
    established: 'December 2025',
    establishedLabel: 'Established December 2025',
    area: 'Sodepur',
    landmark: 'HB Town, 6th Lane / near OPPO–Jockey Sarani',
    howToReach: [
      'Near Sodepur Station.',
      'Landmark: HB Town, 6th Lane.',
      'Area reference: near OPPO / Jockey Sarani as supported for this centre.'
    ],
    address: 'Near Sodepur Station, HB Town 6th Lane (near OPPO/Jockey Sarani), Sodepur, Kolkata',
    mapsLink: 'https://maps.google.com/?q=Sodepur+HB+Town+Kolkata',
    phones: [...OFFICIAL_PHONES],
    whatsapp: OFFICIAL_PHONES[0],
    trainingAvailable: ['Basic Scooty Training', 'Advance Scooty Training'],
    galleryCategory: 'Branch: Sodepur',
    seo: {
      title: 'Scooty Training Sodepur | Seekho',
      description:
        'Seekho Sodepur branch (est. December 2025) near HB Town 6th Lane and Sodepur Station. Basic and advance scooty training.',
      keywords: ['scooty training Sodepur', 'HB Town scooty class', 'Sodepur Station bike scooty training']
    },
    hero: {
      h1: 'Scooty Training in Sodepur',
      eyebrow: 'Sodepur · Est. December 2025',
      subtitle: 'Train near Sodepur Station and HB Town, 6th Lane — Seekho Sodepur opened in December 2025.'
    },
    why: {
      title: 'Why Train at Sodepur',
      body:
        'Established in December 2025 for Sodepur learners. Find the centre near Sodepur Station with landmark HB Town, 6th Lane (near OPPO/Jockey Sarani).'
    },
    usps: [
      { icon: 'fa-solid fa-train-subway', title: 'Near Sodepur Station', text: 'Easy to reach for local station travellers.' },
      { icon: 'fa-solid fa-map-pin', title: 'HB Town, 6th Lane', text: 'Landmark area near OPPO / Jockey Sarani.' },
      { icon: 'fa-solid fa-calendar', title: 'Opened December 2025', text: 'A recent Seekho expansion in north Kolkata suburbs.' },
      { icon: 'fa-solid fa-scooter', title: 'Scooty Courses', text: 'Basic and Advance Scooty Training are offered here.' }
    ],
    whoCanLearn: [
      'Beginners around Sodepur and HB Town',
      'Learners wanting scooty training near the station',
      'Women starting Basic or Advance Scooty courses',
      'Residents near OPPO / Jockey Sarani'
    ],
    women: {
      title: 'Women Learning at Sodepur',
      body: 'Women learners can book scooty training at the Sodepur centre near HB Town, 6th Lane.'
    },
    faqs: [
      {
        q: 'How do I reach the Sodepur branch?',
        a: 'It is near Sodepur Station. Landmark: HB Town, 6th Lane, near OPPO/Jockey Sarani.'
      },
      {
        q: 'When was Sodepur established?',
        a: 'The Sodepur branch was established in December 2025.'
      },
      {
        q: 'What training is available at Sodepur?',
        a: 'Basic Scooty Training and Advance Scooty Training.'
      },
      {
        q: 'Which phones can I call for Sodepur?',
        a: '9748481630 and 7980108587.'
      }
    ],
    showFloatingReviews: false
  },
  {
    slug: 'rabindra-sarobar',
    name: 'Rabindra Sarobar',
    displayName: 'Rabindra Sarobar',
    branchName: 'Rabindra Sarobar Branch',
    isMainBranch: false,
    established: 'March 2026',
    establishedLabel: 'Established March 2026',
    area: 'Rabindra Sarobar',
    landmark: 'Swiss Park, opposite Bhawani Cinema',
    howToReach: [
      'Near Rabindra Sarobar Metro (Gate 6) / Tollygunge railway access as supported for this centre.',
      'Landmark: Swiss Park, opposite Bhawani Cinema.',
      'Ask for Seekho training at Swiss Park, opposite Bhawani Cinema.'
    ],
    address: 'Near Rabindra Sarobar Metro Gate 6 / Tollygunge railway — Swiss Park, opposite Bhawani Cinema',
    mapsLink: 'https://maps.google.com/?q=Swiss+Park+Bhawani+Cinema+Kolkata',
    phones: [...OFFICIAL_PHONES],
    whatsapp: OFFICIAL_PHONES[0],
    trainingAvailable: ['Basic Scooty Training', 'Advance Scooty Training'],
    galleryCategory: 'Branch: Rabindra Sarobar',
    seo: {
      title: 'Scooty Training Rabindra Sarobar | Seekho',
      description:
        'Seekho Rabindra Sarobar (est. March 2026) at Swiss Park, opposite Bhawani Cinema — near Metro Gate 6.',
      keywords: [
        'scooty training Rabindra Sarobar',
        'Swiss Park Bhawani Cinema training',
        'Metro Gate 6 scooty class'
      ]
    },
    hero: {
      h1: 'Scooty Training at Rabindra Sarobar',
      eyebrow: 'South Kolkata · Est. March 2026',
      subtitle:
        'Learn at Swiss Park, opposite Bhawani Cinema — near Rabindra Sarobar Metro Gate 6 / Tollygunge railway.'
    },
    why: {
      title: 'Why Train at Rabindra Sarobar',
      body:
        'Opened in March 2026. The landmark is Swiss Park, opposite Bhawani Cinema, with Metro Gate 6 / Tollygunge railway access nearby.'
    },
    usps: [
      { icon: 'fa-solid fa-train-subway', title: 'Metro Gate 6 Access', text: 'Near Rabindra Sarobar Metro Gate 6 / Tollygunge railway.' },
      { icon: 'fa-solid fa-landmark', title: 'Swiss Park Landmark', text: 'Swiss Park, opposite Bhawani Cinema.' },
      { icon: 'fa-solid fa-calendar', title: 'Established March 2026', text: 'A newer Seekho centre in South Kolkata.' },
      { icon: 'fa-solid fa-scooter', title: 'Scooty Training', text: 'Basic and Advance Scooty Training are offered here.' }
    ],
    whoCanLearn: [
      'Learners near Rabindra Sarobar and Tollygunge railway',
      'Beginners preferring Metro Gate 6 access',
      'Women booking scooty courses',
      'Residents around Swiss Park / Bhawani Cinema'
    ],
    women: {
      title: 'Women Learning at Rabindra Sarobar',
      body:
        'Women can learn scooty riding at this centre — Swiss Park, opposite Bhawani Cinema.'
    },
    faqs: [
      {
        q: 'What is the Rabindra Sarobar landmark?',
        a: 'Swiss Park, opposite Bhawani Cinema.'
      },
      {
        q: 'How do I reach by Metro?',
        a: 'Use Rabindra Sarobar Metro Gate 6 / Tollygunge railway access supported for this centre.'
      },
      {
        q: 'When did this branch open?',
        a: 'It was established in March 2026.'
      },
      {
        q: 'Which courses are available?',
        a: 'Basic Scooty Training and Advance Scooty Training.'
      }
    ],
    showFloatingReviews: false
  },
  {
    slug: 'howrah',
    name: 'Howrah',
    displayName: 'Howrah',
    branchName: 'Howrah Branch',
    isMainBranch: false,
    established: 'March 2026',
    establishedLabel: 'Established March 2026',
    area: 'Howrah',
    landmark: 'Dumurjala Stadium Gate 1',
    howToReach: [
      'Near Dumurjala Stadium.',
      'Landmark: Dumurjala Stadium Gate 1.',
      'Ask for Seekho scooty training at Dumurjala Stadium Gate 1.'
    ],
    address: 'Near Dumurjala Stadium Gate 1, Howrah',
    mapsLink: 'https://maps.google.com/?q=Dumurjala+Stadium+Gate+1+Howrah',
    phones: [...OFFICIAL_PHONES],
    whatsapp: OFFICIAL_PHONES[0],
    trainingAvailable: ['Basic Scooty Training', 'Advance Scooty Training'],
    galleryCategory: 'Branch: Howrah',
    seo: {
      title: 'Scooty Training Howrah | Seekho',
      description:
        'Seekho Howrah branch (est. March 2026) at Dumurjala Stadium Gate 1. Basic and advance scooty training.',
      keywords: ['scooty training Howrah', 'Dumurjala Stadium training', 'Howrah two wheeler class']
    },
    hero: {
      h1: 'Scooty Training in Howrah',
      eyebrow: 'Howrah · Est. March 2026',
      subtitle: 'Train at Dumurjala Stadium Gate 1 — Seekho Howrah opened in March 2026.'
    },
    why: {
      title: 'Why Train at Howrah',
      body:
        'Established in March 2026 for Howrah learners. The centre landmark is Dumurjala Stadium Gate 1.'
    },
    usps: [
      { icon: 'fa-solid fa-building', title: 'Dumurjala Stadium Gate 1', text: 'Clear landmark for finding the Howrah centre.' },
      { icon: 'fa-solid fa-calendar', title: 'Opened March 2026', text: 'Seekho’s Howrah training location.' },
      { icon: 'fa-solid fa-scooter', title: 'Scooty Courses', text: 'Basic and Advance Scooty Training are offered here.' },
      { icon: 'fa-solid fa-handshake', title: 'Book Online or Call', text: 'Reserve a slot via the website or official phone numbers.' }
    ],
    whoCanLearn: [
      'Beginners in Howrah',
      'Learners near Dumurjala Stadium',
      'Women starting scooty training',
      'Anyone seeking Basic or Advance Scooty courses at this centre'
    ],
    women: {
      title: 'Women Learning at Howrah',
      body: 'Women learners can book scooty training at Dumurjala Stadium Gate 1.'
    },
    faqs: [
      {
        q: 'Where is the Howrah branch?',
        a: 'Near Dumurjala Stadium Gate 1.'
      },
      {
        q: 'When was Howrah established?',
        a: 'March 2026.'
      },
      {
        q: 'What training is available in Howrah?',
        a: 'Basic Scooty Training and Advance Scooty Training.'
      },
      {
        q: 'How do I book Howrah classes?',
        a: 'Book online or call / WhatsApp 9748481630 or 7980108587.'
      }
    ],
    showFloatingReviews: false
  },
  {
    slug: 'patuli',
    name: 'Patuli',
    displayName: 'Patuli',
    branchName: 'Patuli Branch',
    isMainBranch: false,
    established: 'September 2026',
    establishedLabel: 'Established September 2026',
    area: 'Patuli',
    landmark: 'Patuli Crossing / Fire Brigade / Patuli Jhil',
    howToReach: [
      'Landmark area: Patuli Crossing.',
      'Also referenced near Fire Brigade and Patuli Jhil.',
      'Ask for Seekho training around Patuli Crossing / Fire Brigade / Patuli Jhil.'
    ],
    address: 'Patuli Crossing / near Fire Brigade & Patuli Jhil, Patuli, Kolkata',
    mapsLink: 'https://maps.google.com/?q=Patuli+Crossing+Kolkata',
    phones: [...OFFICIAL_PHONES],
    whatsapp: OFFICIAL_PHONES[0],
    // Course list not published in supported Sheets export for Patuli — do not invent.
    trainingAvailable: [],
    trainingNote: 'Confirm current courses available at Patuli when you book or call.',
    galleryCategory: 'Branch: Patuli',
    seo: {
      title: 'Two Wheeler Training Patuli | Seekho',
      description:
        'Seekho Patuli branch (est. September 2026) near Patuli Crossing, Fire Brigade and Patuli Jhil. Book or call to confirm courses.',
      keywords: ['scooty training Patuli', 'Patuli Crossing training', 'Patuli Jhil bike scooty class']
    },
    hero: {
      h1: 'Two Wheeler Training in Patuli',
      eyebrow: 'Patuli · Est. September 2026',
      subtitle:
        'Seekho Patuli — near Patuli Crossing, Fire Brigade and Patuli Jhil. Established September 2026.'
    },
    why: {
      title: 'Why Train at Patuli',
      body:
        'Opened in September 2026. Find the centre around Patuli Crossing, with Fire Brigade and Patuli Jhil as area references.'
    },
    usps: [
      { icon: 'fa-solid fa-road', title: 'Patuli Crossing', text: 'Located around the Patuli Crossing area.' },
      { icon: 'fa-solid fa-fire-extinguisher', title: 'Near Fire Brigade', text: 'Area reference includes the Fire Brigade landmark.' },
      { icon: 'fa-solid fa-water', title: 'Patuli Jhil', text: 'Also referenced near Patuli Jhil.' },
      { icon: 'fa-solid fa-calendar', title: 'Established September 2026', text: 'Seekho’s Patuli training location.' }
    ],
    whoCanLearn: [
      'Learners living around Patuli Crossing',
      'Beginners near Fire Brigade / Patuli Jhil',
      'Women looking for a nearby Seekho centre',
      'Anyone who prefers to confirm course options by phone before booking'
    ],
    women: {
      title: 'Women Learning at Patuli',
      body: 'Women learners are welcome — call or book online to confirm the course options currently running at Patuli.'
    },
    faqs: [
      {
        q: 'Where is the Patuli branch?',
        a: 'Around Patuli Crossing, near Fire Brigade and Patuli Jhil.'
      },
      {
        q: 'When was Patuli established?',
        a: 'September 2026.'
      },
      {
        q: 'Which courses run at Patuli?',
        a: 'Confirm current Patuli courses when you book or call 9748481630 / 7980108587 — we do not list unsupported course claims here.'
      },
      {
        q: 'How do I get directions?',
        a: 'Use the maps link on this page for Patuli Crossing, or call us for guidance.'
      }
    ],
    showFloatingReviews: false
  }
];

function listLocations() {
  return LOCATIONS.map((loc) => ({ ...loc }));
}

function getLocation(slug) {
  const key = String(slug || '').toLowerCase().trim();
  return LOCATIONS.find((l) => l.slug === key) || null;
}

function locationPaths() {
  return LOCATIONS.map((l) => `/locations/${l.slug}`);
}

function galleryCategories() {
  return LOCATIONS.map((l) => l.galleryCategory);
}

function publicCard(loc) {
  return {
    slug: loc.slug,
    name: loc.displayName,
    branchName: loc.branchName,
    area: loc.area,
    address: loc.address,
    landmark: loc.landmark,
    establishedLabel: loc.establishedLabel,
    phones: loc.phones,
    whatsapp: loc.whatsapp,
    mapsLink: loc.mapsLink,
    trainingAvailable: loc.trainingAvailable,
    href: `/locations/${loc.slug}`,
    galleryCategory: loc.galleryCategory,
    isMainBranch: !!loc.isMainBranch
  };
}

function listPublicCards() {
  return LOCATIONS.map(publicCard);
}

function chatbotBranchList() {
  return LOCATIONS.map((l) => l.displayName).join(', ');
}

function chatbotBranchDetail(slug) {
  const loc = getLocation(slug);
  if (!loc) return '';
  const courses = loc.trainingAvailable.length
    ? loc.trainingAvailable.join(', ')
    : (loc.trainingNote || 'Confirm courses when booking');
  return `${loc.displayName} (${loc.establishedLabel}). Landmark/area: ${loc.landmark}. Address: ${loc.address}. Training: ${courses}. Page: /locations/${loc.slug}`;
}

function localBusinessJsonLd(loc, baseUrl) {
  const url = `${baseUrl}/locations/${loc.slug}`;
  const node = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: loc.isMainBranch ? MAIN_BRANCH.name : `Seekho Two Wheeler Academy — ${loc.displayName}`,
    alternateName: loc.isMainBranch ? MAIN_BRANCH.alternateName : undefined,
    description: loc.seo.description,
    url,
    telephone: loc.phones.map((p) => `+91${p}`),
    address: loc.isMainBranch
      ? postalAddress(MAIN_BRANCH)
      : {
          '@type': 'PostalAddress',
          streetAddress: loc.address,
          addressLocality: 'Kolkata',
          addressRegion: 'West Bengal',
          addressCountry: 'IN'
        }
  };
  if (loc.placeId && loc.isMainBranch) {
    node.hasMap = loc.mapsLink;
  } else if (loc.mapsLink) {
    node.hasMap = loc.mapsLink;
  }
  return node;
}

function faqPageJsonLd(loc) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (loc.faqs || []).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
}

function breadcrumbJsonLd(loc, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Branches', item: `${baseUrl}/pages/branches.html` },
      {
        '@type': 'ListItem',
        position: 3,
        name: loc.displayName,
        item: `${baseUrl}/locations/${loc.slug}`
      }
    ]
  };
}

function baseUrl() {
  return String(config.baseUrl || 'https://seekho2wheeler.vercel.app').replace(/\/$/, '');
}

/** Seed rows for local/Sheets branch listing (7 locations only — not doorstep). */
function branchSeedRows(now = new Date().toISOString()) {
  return LOCATIONS.map((loc, i) => ({
    id: `branch-loc-${loc.slug}`,
    name: loc.branchName,
    area: loc.area,
    address: loc.address,
    mapsLink: loc.mapsLink || '',
    latitude: '',
    longitude: '',
    phone: loc.phones[0],
    whatsapp: loc.whatsapp,
    availableCourses: loc.trainingAvailable,
    trainerCount: 0,
    image: '',
    active: true,
    locationSlug: loc.slug,
    createdAt: now,
    updatedAt: now,
    displayOrder: i + 1
  }));
}

module.exports = {
  LOCATIONS,
  OFFICIAL_PHONES,
  listLocations,
  getLocation,
  locationPaths,
  galleryCategories,
  publicCard,
  listPublicCards,
  chatbotBranchList,
  chatbotBranchDetail,
  localBusinessJsonLd,
  faqPageJsonLd,
  breadcrumbJsonLd,
  baseUrl,
  branchSeedRows
};
