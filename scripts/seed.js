/**
 * Seed default content using local optimized academy photos.
 * - Google Sheets ready → writes via Sheets API
 * - Otherwise → local JSON (development only)
 */
const slugify = require('slugify');
require('dotenv').config();

const isMain = require.main === module;

async function seed() {
  const db = require('../server/services/db');
  const config = require('../server/config');
  const { ensureAdmin } = require('../server/services/auth');
  const { ensureDataFiles, replaceAll } = require('../server/services/localStore');

  if (config.sheets.ready) {
    console.log('Google Sheets is primary — seeding content into Sheets.');
  } else if (config.sheets.enabled) {
    console.warn('GOOGLE_SHEETS_ENABLED=true but credentials incomplete — seeding local JSON for development only.');
  } else {
    console.log('Seeding local JSON (development mode).');
  }

  ensureDataFiles();
  await ensureAdmin();

  const write = async (sheet, rows) => {
    if (config.sheets.ready) return db.replaceAll(sheet, rows);
    return replaceAll(sheet, rows);
  };

  const g = (n) => `/images/gallery/seekho-${String(n).padStart(2, '0')}.webp`;
  const b = (n) => `/images/banners/seekho-${String(n).padStart(2, '0')}.webp`;
  const c = (n) => `/images/courses/seekho-${String(n).padStart(2, '0')}.webp`;
  const br = (n) => `/images/branches/seekho-${String(n).padStart(2, '0')}.webp`;
  const bl = (n) => `/images/blogs/seekho-${String(n).padStart(2, '0')}.webp`;
  const t = (n) => `/images/testimonials-safe/seekho-${String(n).padStart(2, '0')}.webp`;
  const now = new Date().toISOString();
  const courseRow = (id, name, price, classes, description, image, features, sort, badge = '') => {
    const slug = slugify(name, { lower: true, strict: true });
    return {
      id,
      name,
      slug,
      description,
      price,
      classes,
      image_url: image,
      badge,
      is_active: true,
      sort_order: sort,
      title_bold: false,
      features,
      courseName: name,
      duration: `${classes} classes`,
      image,
      displayOrder: sort,
      active: true,
      created_at: now,
      updated_at: now,
      createdAt: now,
      updatedAt: now
    };
  };

  await write('banners', [
    { id: 'banner-1', title: 'Learn To Ride. Build Confidence. Live Independently.', subtitle: 'Premium scooty & bike training for women and beginners across Kolkata.', ctaText: 'Book Training', ctaLink: '/pages/booking.html', image: b(1), displayOrder: 1, active: true, createdAt: now, updatedAt: now },
    { id: 'banner-2', title: 'Women Empowerment Starts Here.', subtitle: 'Every woman deserves freedom, safety and the confidence to ride alone.', ctaText: 'Start Learning', ctaLink: '/pages/booking.html', image: b(7), displayOrder: 2, active: true, createdAt: now, updatedAt: now },
    { id: 'banner-3', title: 'Ride Without Fear.', subtitle: 'Patient trainers. Real road practice. Confidence from your first lesson.', ctaText: 'Get Started', ctaLink: '/pages/booking.html', image: b(2), displayOrder: 3, active: true, createdAt: now, updatedAt: now },
    { id: 'banner-4', title: 'From Beginner To Confident Rider.', subtitle: 'Expert guidance that takes you from zero experience to road-ready.', ctaText: 'Explore Courses', ctaLink: '/pages/courses.html', image: b(3), displayOrder: 4, active: true, createdAt: now, updatedAt: now },
    { id: 'banner-5', title: 'Thousands Trained Successfully.', subtitle: "Join Kolkata's trusted two-wheeler academy since 2018.", ctaText: 'Join Today', ctaLink: '/pages/booking.html', image: b(5), displayOrder: 5, active: true, createdAt: now, updatedAt: now }
  ]);

  await write('pricing', [
    courseRow('price-1', 'Scooty Training', 2500.00, 15, 'Perfect for beginners — balance, control, traffic basics and confident city riding.', c(1), ['Non-cyclists welcome', 'Female-friendly trainers', 'Flexible timing', 'Certificate guidance'], 1),
    courseRow('price-2', 'Bike Training', 3000.00, 15, 'Gear shifting, clutch control, balance and real-road motorcycle practice.', c(3), ['Clutch mastery', 'Gear practice', 'Road confidence', 'Patient trainers'], 2),
    courseRow('price-3', 'Ladies Training', 2500.00, 15, 'Specially designed sessions for women — safe, supportive and empowering.', c(7), ['Women-first batches', 'Safe environment', 'Confidence building', 'Scooty & bike options'], 3),
    courseRow('price-4', 'Electric Vehicle Training', 2800.00, 12, 'Learn to ride electric scooties with modern controls and city practice.', c(4), ['EV basics', 'Throttle control', 'Battery awareness', 'City routes'], 4),
    courseRow('price-5', 'Road Practice', 2000.00, 8, 'Real traffic exposure with trainer guidance for everyday independence.', c(5), ['Live traffic', 'Signal practice', 'Lane discipline', 'Defensive riding'], 5),
    courseRow('price-6', 'RTO Practice', 1500.00, 5, 'Focused practice for RTO driving test routes and requirements.', c(6), ['Test track drills', 'Figure-8 practice', 'Document guidance', 'Mock tests'], 6)
  ]);

  await write('home_sections', [{
    id: 'home-doorstep',
    key: 'doorstep',
    title: 'DOORSTEP TRAINING',
    subtitle: 'Learn to Ride. We Come to You.',
    description: 'Learn scooty or bike from the comfort of your own neighbourhood with personalised, one-on-one doorstep training.',
    image_url: c(5),
    features_json: [
      { icon: '🛵', text: 'Scooty + Bike Training' },
      { icon: '📍', text: 'Up to 10 KM from Netaji metro' },
      { icon: '👨‍🏫', text: 'Personal Trainer at Your Location' },
      { icon: '📅', text: '15-Session Standard Package' },
      { icon: '⚙️', text: 'Customisable Duration & Schedule' }
    ],
    link_slug: 'doorstep-training',
    is_active: true,
    sort_order: 1,
    title_bold: false,
    created_at: now,
    updated_at: now
  }, {
    id: 'home-why-choose',
    key: 'why_choose',
    title: 'Training Built For Real Confidence',
    subtitle: 'Why Choose Seekho',
    description: 'Patient trainers, flexible slots, and guided road practice — everything you need to ride independently.',
    image_url: '',
    features_json: [],
    link_slug: '',
    is_active: true,
    sort_order: 1,
    title_bold: false,
    created_at: now,
    updated_at: now
  }]);

  await write('why_choose', [
    { id: 'why-1', title: 'Non-Cyclists Welcome', description: 'Special programs for those who never rode a cycle before.', icon: 'fa-solid fa-person-rays', is_active: true, sort_order: 1, title_bold: false, link_slug: '', created_at: now, updated_at: now },
    { id: 'why-2', title: 'Women-First Environment', description: 'Female-friendly batches with supportive, patient trainers.', icon: 'fa-solid fa-venus', is_active: true, sort_order: 2, title_bold: false, link_slug: '', created_at: now, updated_at: now },
    { id: 'why-3', title: 'Real Traffic Practice', description: 'Guided sessions on actual Kolkata roads with expert supervision.', icon: 'fa-solid fa-road', is_active: true, sort_order: 3, title_bold: false, link_slug: '', created_at: now, updated_at: now },
    { id: 'why-4', title: 'Flexible Timing', description: 'Morning and evening slots across 4 branches in Kolkata.', icon: 'fa-solid fa-clock', is_active: true, sort_order: 4, title_bold: false, link_slug: '', created_at: now, updated_at: now },
    { id: 'why-5', title: 'Patient Experienced Trainers', description: 'Step-by-step guidance until you feel road-ready.', icon: 'fa-solid fa-chalkboard-user', is_active: true, sort_order: 5, title_bold: false, link_slug: '', created_at: now, updated_at: now },
    { id: 'why-6', title: 'Multiple Vehicles', description: 'Practice on academy scooties and bikes at every branch.', icon: 'fa-solid fa-motorcycle', is_active: true, sort_order: 6, title_bold: false, link_slug: '', created_at: now, updated_at: now }
  ]);

  await write('detail_pages', [
    { id: 'page-doorstep-training', slug: 'doorstep-training', title: 'DOORSTEP TRAINING', hero_image_url: c(5), body_html: '', seo_title: 'Doorstep Training | Seekho Two Wheeler Academy', seo_description: 'Learn scooty or bike at your location. Doorstep training from Seekho Two Wheeler Academy, Kolkata.', is_active: true, created_at: now, updated_at: now },
    { id: 'page-our-mission', slug: 'our-mission', title: 'Our Mission', hero_image_url: '/images/thumbs/seekho-01.webp', body_html: '<p>Details coming soon</p>', seo_title: 'Our Mission | Seekho Two Wheeler Academy', seo_description: 'Empowering every learner to ride independently and safely on Kolkata roads.', is_active: true, created_at: now, updated_at: now },
    { id: 'page-our-journey', slug: 'our-journey', title: 'Our Journey', hero_image_url: '', body_html: '', seo_title: 'Our Journey | Seekho Two Wheeler Academy', seo_description: 'From 2018 to today — Seekho Two Wheeler Academy in Kolkata.', is_active: true, created_at: now, updated_at: now },
    { id: 'page-women-empowerment', slug: 'women-empowerment', title: 'Women Empowerment', hero_image_url: '/images/thumbs/seekho-07.webp', body_html: '', seo_title: 'Women Empowerment | Seekho Two Wheeler Academy', seo_description: 'Ladies batches and supportive training for women riders in Kolkata.', is_active: true, created_at: now, updated_at: now },
    { id: 'page-our-story', slug: 'our-story', title: 'Our Story', hero_image_url: '/images/thumbs/seekho-02.webp', body_html: '', seo_title: 'Our Story | Seekho Two Wheeler Academy', seo_description: 'How Seekho Two Wheeler Academy grew across Kolkata.', is_active: true, created_at: now, updated_at: now }
  ]);

  await write('doorstep_pricing', [{
    id: 'default',
    base_km: 3,
    base_price: 4500,
    max_km: 10,
    max_price: 8000,
    per_km_extra: 500,
    pricing_mode: 'linear_ceil',
    out_of_range_message: 'Doorstep service is available up to 10 km',
    created_at: now,
    updated_at: now
  }]);

  await write('branches', [
    { id: 'branch-1', name: 'Tollygunge Branch', area: 'Tollygunge', address: 'Near Metro Station, Tollygunge, Kolkata', mapsLink: 'https://maps.google.com/?q=Tollygunge+Kolkata', latitude: '', longitude: '', phone: '9748481630', whatsapp: '9748481630', availableCourses: ['Scooty Training', 'Bike Training', 'Ladies Training', 'Road Practice'], trainerCount: 6, image: br(1), active: true, createdAt: now, updatedAt: now },
    { id: 'branch-2', name: 'New Town Branch', area: 'New Town', address: 'Action Area, New Town, Kolkata', mapsLink: 'https://maps.google.com/?q=New+Town+Kolkata', latitude: '', longitude: '', phone: '7980108587', whatsapp: '7980108587', availableCourses: ['Scooty Training', 'Bike Training', 'Electric Vehicle Training', 'RTO Practice'], trainerCount: 5, image: br(2), active: true, createdAt: now, updatedAt: now },
    { id: 'branch-3', name: 'Barasat Branch', area: 'Barasat', address: 'Barasat, North 24 Parganas, Kolkata', mapsLink: 'https://maps.google.com/?q=Barasat+Kolkata', latitude: '', longitude: '', phone: '7980108587', whatsapp: '7980108587', availableCourses: ['Scooty Training', 'Ladies Training', 'Bike Training'], trainerCount: 4, image: br(3), active: true, createdAt: now, updatedAt: now },
    { id: 'branch-4', name: 'Sodepur Branch', area: 'Sodepur', address: 'Sodepur, Kolkata', mapsLink: 'https://maps.google.com/?q=Sodepur+Kolkata', latitude: '', longitude: '', phone: '9748481630', whatsapp: '9748481630', availableCourses: ['Scooty Training', 'Bike Training', 'Road Practice', 'RTO Practice'], trainerCount: 4, image: br(5), active: true, createdAt: now, updatedAt: now }
  ]);

  const categories = ['Scooty Training', 'Women Riders', 'Bike Training', 'Student Success', 'Road Practice', 'Branch Activities', 'Women Riders'];
  await write('gallery', [1, 2, 3, 4, 5, 6, 7].map((n, i) => ({
    id: `gal-${n}`,
    title: `Training moment ${n}`,
    category: categories[i],
    image: g(n),
    displayOrder: n,
    active: true,
    createdAt: now,
    updatedAt: now
  })));

  await write('blogs', [
    { id: 'blog-1', title: 'How to Learn Scooty Without Knowing Cycle', slug: 'how-to-learn-scooty-without-knowing-cycle', featuredImage: bl(1), metaTitle: 'Learn Scooty Without Cycle | Seekho Academy Kolkata', metaDescription: 'Non-cyclists can learn scooty riding safely. Step-by-step tips from Seekho Two Wheeler Academy trainers in Kolkata.', content: `<p>Many students believe they must know cycling before learning scooty. At Seekho, that is not true.</p><p>Our trainers start with balance drills, slow control, and gradual traffic exposure — designed especially for non-cyclists and women beginners.</p>`, status: 'published', scheduledAt: null, publishedAt: now, createdAt: now, updatedAt: now },
    { id: 'blog-2', title: 'How to Learn Scooty Fast', slug: 'how-to-learn-scooty-fast', featuredImage: bl(2), metaTitle: 'How to Learn Scooty Fast | Seekho Two Wheeler Academy', metaDescription: 'Practical tips to learn scooty riding faster with professional training in Kolkata.', content: `<p>Consistency beats intensity. Short, focused sessions with a professional trainer help you progress faster.</p>`, status: 'published', scheduledAt: null, publishedAt: now, createdAt: now, updatedAt: now },
    { id: 'blog-3', title: 'Why Women Should Learn Two Wheeler Riding', slug: 'why-women-should-learn-two-wheeler-riding', featuredImage: bl(7), metaTitle: 'Women Two Wheeler Training Kolkata | Seekho Academy', metaDescription: 'Riding builds independence, confidence and freedom. Discover why women across Kolkata choose Seekho.', content: `<p>Learning to ride is more than a skill — it is independence. Seekho provides a female-friendly environment so every woman can ride without fear.</p>`, status: 'published', scheduledAt: null, publishedAt: now, createdAt: now, updatedAt: now }
  ]);

  await write('faqs', [
    { id: 'faq-1', question: 'আমি সাইকেল চালাতে পারি না — স্কুটি শিখতে পারবো?', answer: 'হ্যাঁ! Seekho-তে non-cyclists-দের জন্য বিশেষ ট্রেনিং আছে। হাজারো শিক্ষার্থী সাইকেল না জেনেই স্কুটি ও বাইক শিখেছেন।', displayOrder: 1, active: true, createdAt: now, updatedAt: now },
    { id: 'faq-2', question: 'Can women learn in a safe environment?', answer: 'Absolutely. We offer female-friendly batches, patient trainers, and a supportive atmosphere focused on confidence and safety.', displayOrder: 2, active: true, createdAt: now, updatedAt: now },
    { id: 'faq-3', question: 'What is the course duration and timing?', answer: 'Duration depends on your progress. We offer flexible morning and evening slots across multiple Kolkata branches.', displayOrder: 3, active: true, createdAt: now, updatedAt: now },
    { id: 'faq-4', question: 'Do you provide vehicles for training?', answer: 'Yes. Multiple scooties and bikes are available at each branch so you can practice on academy vehicles.', displayOrder: 4, active: true, createdAt: now, updatedAt: now },
    { id: 'faq-5', question: 'Is road / traffic practice included?', answer: 'Yes. After basic control, trainers take students for guided real-traffic practice so you become road-ready.', displayOrder: 5, active: true, createdAt: now, updatedAt: now },
    { id: 'faq-6', question: 'How do I book a training slot?', answer: 'Use the Register & Book form on our website, call us, or WhatsApp 9748481630. Choose course, branch, date and time.', displayOrder: 6, active: true, createdAt: now, updatedAt: now }
  ]);

  await write('testimonials', [
    { id: 'rev-1', name: 'Priya Banerjee', headline: 'Non-Cyclist to Confident Rider', review: 'I never rode a cycle, yet within weeks I was riding scooty alone to work. Trainers were so patient.', rating: 5, photo: t(1), videoUrl: '', type: 'text', displayOrder: 1, active: true, createdAt: now, updatedAt: now },
    { id: 'rev-2', name: 'Ananya Das', headline: 'Housewife to Independent Rider', review: 'Seekho gave me freedom. Now I drop my kids to school myself. Best decision for my confidence.', rating: 5, photo: t(7), videoUrl: '', type: 'video', displayOrder: 2, active: true, createdAt: now, updatedAt: now },
    { id: 'rev-3', name: 'Riya Chatterjee', headline: 'From Fear to Freedom', review: 'Ladies batch felt safe and supportive. Road practice built real confidence in Kolkata traffic.', rating: 5, photo: t(2), videoUrl: '', type: 'text', displayOrder: 3, active: true, createdAt: now, updatedAt: now },
    { id: 'rev-4', name: 'Sourav Ghosh', headline: 'Bike Training Done Right', review: 'Clutch and gear control were taught step by step. Highly recommend for absolute beginners.', rating: 5, photo: t(3), videoUrl: '', type: 'text', displayOrder: 4, active: true, createdAt: now, updatedAt: now }
  ]);

  await write('settings', [{
    id: 'settings-1',
    siteName: 'Seekho Two Wheeler Academy',
    tagline: 'Empowering Independence Through Safe Riding',
    phones: ['9748481630', '7980108587'],
    whatsapp: '9748481630',
    email: 'info@seekhoacademy.com',
    address: '1, 78, Banerjee Para Rd, Haridevpur, Paschim Putiary, Kolkata, West Bengal 700041, India',
    gmb_url: 'https://www.google.com/maps/search/?api=1&query=Kolkata%20Scooty%20Bike%20Training%20Centre&query_place_id=ChIJTW1jJIZxAjoR5lZey5JaXcY',
    latitude: '',
    longitude: '',
    map_embed_url: '',
    facebookUrl: 'https://www.facebook.com/kolkatascootybiketraining',
    instagramUrl: 'https://www.instagram.com/scooty_bike_training_centre',
    youtubeUrl: 'https://youtube.com/@kolkatascootybiketrainingcentr',
    googleRating: 4.9,
    facebookRating: 4.8,
    reviewCount: 500,
    workingHours: 'Mon – Sun: 7:00 AM – 7:00 PM',
    trainedCandidates: '5000+',
    foundedYear: '2018',
    createdAt: now,
    updatedAt: now
  }]);

  const { QA_SEED, CONFIG_SEED } = require('../server/services/chatbot');
  await write('chatbot_config', [{ ...CONFIG_SEED, created_at: now, updated_at: now }]);
  await write('chatbot_qa', QA_SEED.map((q) => ({ ...q, created_at: now, updated_at: now })));
  await write('chatbot_unanswered', []);
  await write('updates', []);
  const { COPY_SEED } = require('../server/services/pageCopy');
  await write('page_copy', COPY_SEED.map((r) => ({ ...r, created_at: now, updated_at: now })));

  console.log(config.sheets.ready
    ? '✓ Seed data written to Google Sheets'
    : '✓ Seed data written to local JSON (development)');
  if (isMain) process.exit(0);
}

module.exports = seed;

if (isMain) {
  seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
