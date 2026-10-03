const db = require('./db');
const { sanitizeHtml, parseBool } = require('../utils/sanitizeHtml');

function slot(page, key, fields, sort) {
  return {
    id: `copy-${page}-${key}`,
    page,
    slot: key,
    title: fields.title || '',
    subtitle: fields.subtitle || '',
    body_html: fields.body_html || '',
    cta_text: fields.cta_text || '',
    cta_link: fields.cta_link || '',
    is_active: true,
    sort_order: sort || 0
  };
}

const COPY_SEED = [
  slot('layout', 'header_cta', { title: 'Register & Book', cta_text: 'Register & Book', cta_link: '/pages/booking.html' }, 1),
  slot('layout', 'footer_cta', {
    title: 'Ready To Start Your Riding Journey?',
    body_html: '<p>Join thousands of confident riders trained at Seekho Two Wheeler Academy.</p>',
    cta_text: 'Register & Book Now',
    cta_link: '/pages/booking.html'
  }, 2),
  slot('layout', 'footer_trust', { title: 'Easy Registration', subtitle: 'Quick Booking', body_html: 'Instant Confirmation' }, 3),
  slot('layout', 'nav_scooty', { title: 'Scooty Training' }, 12.1),
  slot('layout', 'nav_bike', { title: 'Bike Training' }, 12.2),
  slot('layout', 'nav_ladies', { title: 'Ladies Training' }, 12.3),
  slot('layout', 'nav_ev', { title: 'Electric Vehicle' }, 12.4),
  slot('layout', 'nav_road', { title: 'Road Practice' }, 12.5),
  slot('layout', 'nav_rto', { title: 'RTO Practice' }, 12.6),
  slot('layout', 'link_privacy', { title: 'Privacy' }, 26),
  slot('layout', 'link_terms', { title: 'Terms' }, 27),
  slot('layout', 'link_whatsapp', { title: 'WhatsApp Us' }, 28),
  slot('layout', 'link_maps', { title: 'Google Maps' }, 29),
  slot('layout', 'sticky_call', { title: 'Call' }, 4),
  slot('layout', 'sticky_wa', { title: 'WhatsApp' }, 5),
  slot('layout', 'sticky_book', { title: 'Book Slot', cta_link: '/pages/booking.html' }, 6),
  slot('layout', 'nav_home', { title: 'Home' }, 10),
  slot('layout', 'nav_about', { title: 'About Us' }, 11),
  slot('layout', 'nav_courses', { title: 'Courses' }, 12),
  slot('layout', 'nav_branches', { title: 'Branches' }, 13),
  slot('layout', 'nav_gallery', { title: 'Gallery' }, 14),
  slot('layout', 'nav_blog', { title: 'Blog' }, 15),
  slot('layout', 'nav_reviews', { title: 'Reviews' }, 16),
  slot('layout', 'nav_contact', { title: 'Contact' }, 17),
  slot('layout', 'col_quick', { title: 'Quick Links' }, 20),
  slot('layout', 'col_courses', { title: 'Courses' }, 21),
  slot('layout', 'col_branches', { title: 'Branches' }, 22),
  slot('layout', 'col_contact', { title: 'Contact' }, 23),
  slot('layout', 'footer_bottom', { title: 'All rights reserved.' }, 24),
  slot('layout', 'logo_subline', { title: 'ACADEMY · KOLKATA' }, 25),

  slot('home', 'about_head', {
    subtitle: 'About Us',
    title: "Kolkata's Trusted Riding Academy",
    body_html: '<p>Since 2018, Seekho Two Wheeler Academy has helped thousands learn scooty and bike riding with patience, safety and real-road confidence.</p>'
  }, 30),
  slot('home', 'mission_card', {
    title: 'Our Mission',
    body_html: '<p>To empower every learner — especially women and non-cyclists — with the skills and confidence to ride independently and safely on Kolkata roads.</p>'
  }, 31),
  slot('home', 'journey_card', { title: 'Our Journey' }, 32),
  slot('home', 'journey_2018', { title: '2018', subtitle: 'Founded with a vision to make two-wheeler training accessible to everyone.' }, 33),
  slot('home', 'journey_2020', { title: '2020', subtitle: 'Expanded ladies-only batches and non-cyclist programs across Kolkata.' }, 34),
  slot('home', 'journey_2023', { title: '2023', subtitle: 'Opened multiple branches with EV training and RTO practice modules.' }, 35),
  slot('home', 'journey_today', { title: 'Today', subtitle: '5000+ confident riders trained with 4.9★ Google reviews.' }, 36),
  slot('home', 'women_card', {
    title: 'Women Empowerment',
    body_html: '<p>Every woman deserves freedom on the road. Our ladies batches build confidence, independence and safe riding skills in a supportive environment.</p>'
  }, 37),
  slot('home', 'highlight_students', { title: 'Students Trained' }, 40),
  slot('home', 'highlight_since', { title: 'Since' }, 41),
  slot('home', 'highlight_branches', { title: 'Branches', subtitle: '7' }, 42),
  slot('home', 'highlight_rating', { title: 'Google Rating' }, 43),
  slot('home', 'highlight_safety', { title: 'Safety Focus', subtitle: '100%' }, 44),
  slot('home', 'highlight_slots', { title: 'Flexible Slots', subtitle: '7AM–7PM' }, 45),
  slot('home', 'courses_head', {
    subtitle: 'Training Programs & Pricing',
    title: 'Choose Perfect Training',
    body_html: '<p>Five courses. Starting from ₹2,500. From Basic Scooty to RTO Preparation.</p>'
  }, 50),
  slot('home', 'branches_head', {
    subtitle: 'Our Branches',
    title: 'Find A Branch Near You',
    body_html: '<p>Seven convenient locations across Kolkata with flexible morning and evening slots.</p>'
  }, 51),
  slot('home', 'gallery_head', {
    subtitle: 'Gallery',
    title: 'Training In Action',
    body_html: '<p>Real moments from our scooty, bike and ladies training sessions across Kolkata.</p>',
    cta_text: 'View Full Gallery',
    cta_link: '/pages/gallery.html'
  }, 52),
  slot('home', 'blog_head', {
    subtitle: 'Blog',
    title: 'Riding Tips & Insights',
    body_html: '<p>Expert advice on learning scooty, bike riding and building road confidence.</p>',
    cta_text: 'Read More Articles',
    cta_link: '/pages/blog.html'
  }, 53),
  slot('home', 'reviews_head', {
    subtitle: 'Student Stories',
    title: 'What Our Riders Say',
    body_html: '<p>Real feedback from students who went from beginners to confident independent riders.</p>',
    cta_text: 'Read All Reviews',
    cta_link: '/pages/reviews.html'
  }, 54),
  slot('home', 'faq_head', {
    subtitle: 'FAQ',
    title: 'Frequently Asked Questions',
    body_html: '<p>Common questions about our training programs, timing and booking process.</p>',
    cta_text: 'View All FAQs',
    cta_link: '/pages/faq.html'
  }, 55),
  slot('home', 'social_head', {
    subtitle: 'Follow Us',
    title: 'Stay Connected',
    body_html: '<p>Follow Seekho on social media for student stories, tips and training updates.</p>'
  }, 56),
  slot('home', 'women_head', {
    subtitle: 'Women Empowerment',
    title: 'Freedom Begins With Your First Ride',
    body_html: '<p>Seekho was built for women who want independence — to commute, drop kids to school, and move through the city without waiting on anyone.</p>',
    cta_text: 'Book Ladies Training',
    cta_link: '/pages/booking.html'
  }, 58),
  slot('home', 'women_l1', { title: 'Female-friendly batches & patient trainers' }, 58.1),
  slot('home', 'women_l2', { title: 'Non-cyclists learn from absolute zero' }, 58.2),
  slot('home', 'women_l3', { title: 'Guided road practice for real confidence' }, 58.3),
  slot('home', 'women_l4', { title: 'Flexible morning & evening slots' }, 58.4),
  slot('home', 'contact_head', {
    subtitle: 'Contact',
    title: 'Get In Touch',
    body_html: '<p>Have questions? Send us an enquiry and we\'ll call you back shortly.</p>'
  }, 59),
  slot('home', 'label_call', { title: 'Call Us' }, 59.1),
  slot('home', 'label_whatsapp', { title: 'WhatsApp' }, 59.2),
  slot('home', 'label_email', { title: 'Email' }, 59.3),
  slot('home', 'label_hours', { title: 'Hours' }, 59.4),
  slot('home', 'contact_submit', { title: 'Send Enquiry' }, 59.5),
  slot('home', 'doorstep_widget', {
    title: 'Doorstep scooty — check your price',
    subtitle: 'Enter distance in kilometres to see the live price from our booking rules.',
    body_html: 'Distance (km)'
  }, 59.6),
  slot('home', 'label_google_reviews', { title: 'Google Reviews' }, 59.7),
  slot('home', 'label_facebook_reviews', { title: 'Facebook Reviews' }, 59.8),
  slot('home', 'label_candidates_trained', { title: 'Candidates Trained' }, 59.9),
  slot('home', 'label_academy_location', { title: 'Academy location' }, 59.91),
  slot('home', 'branches_view', { title: 'View All', cta_link: '/pages/branches.html' }, 59.92),

  slot('about', 'hero', {
    title: 'About Seekho Two Wheeler Academy',
    subtitle: 'Empowering Independence Through Safe Riding — trusted scooty & bike training across Kolkata since 2018.'
  }, 60),
  slot('about', 'mission', {
    title: 'Our Mission',
    body_html: '<p>To empower every learner — especially women and non-cyclists — with the skills and confidence to ride independently and safely on Kolkata roads.</p>',
    cta_text: 'Open in new tab'
  }, 61),
  slot('about', 'story', {
    title: 'Our Story',
    body_html: '<p>Seekho Two Wheeler Academy was founded with a simple belief: everyone deserves the freedom to ride. What started as a small training centre in Kolkata has grown into a multi-branch academy with successful students.</p>'
  }, 62),
  slot('about', 'different', { title: 'What Makes Us Different' }, 63),
  slot('about', 'diff_trainers', { title: 'Patient, Expert Trainers', subtitle: 'Certified instructors who specialize in beginners and non-cyclists.' }, 64),
  slot('about', 'diff_women', { title: 'Women-First Approach', subtitle: 'Dedicated ladies batches in a safe, supportive environment.' }, 65),
  slot('about', 'diff_branches', { title: '7 Kolkata Branches', subtitle: 'Tollygunge, Barasat, New Town, Sodepur, Rabindra Sarobar, Howrah and Patuli — pick what\'s nearest.' }, 66),
  slot('about', 'promise', {
    title: 'Our Promise',
    body_html: '<p>We don\'t just teach you to ride — we build lasting confidence. From your first balance drill to guided traffic practice, every lesson is designed to make you an independent, safe rider on Kolkata roads.</p>',
    cta_text: 'Start Your Journey',
    cta_link: '/pages/booking.html'
  }, 67),
  slot('about', 'numbers_head', { subtitle: 'By The Numbers', title: 'Trusted By Thousands' }, 68),
  slot('about', 'stat_students', { title: 'Students Trained' }, 69),
  slot('about', 'stat_rating', { title: 'Google Rating' }, 70),
  slot('about', 'stat_branches', { title: 'Branches', subtitle: '4' }, 71),
  slot('about', 'stat_courses', { title: 'Course Programs', subtitle: '6' }, 72),
  slot('about', 'stat_safety', { title: 'Safety Focus', subtitle: '100%' }, 73),

  slot('contact', 'hero', {
    title: 'Contact Us',
    subtitle: 'Have questions about training? Call us, WhatsApp or send an enquiry — we\'ll respond quickly.'
  }, 80),
  slot('contact', 'label_phone', { title: 'Phone' }, 81),
  slot('contact', 'label_whatsapp', { title: 'WhatsApp' }, 82),
  slot('contact', 'label_email', { title: 'Email' }, 83),
  slot('contact', 'label_branches', { title: 'Branches', subtitle: 'Tollygunge · Barasat · New Town · Sodepur · Rabindra Sarobar · Howrah · Patuli', cta_text: 'View All Branches', cta_link: '/pages/branches.html' }, 84),
  slot('contact', 'label_hours', { title: 'Hours' }, 85),
  slot('contact', 'form_title', { title: 'Send An Enquiry', cta_text: 'Send Enquiry' }, 86),

  slot('courses', 'hero', {
    title: 'Our Training Programs',
    subtitle: 'Five focused courses — Basic Scooty, Advanced Scooty, Bike Training, Doorstep Training and RTO Preparation. Starting from ₹2,500.'
  }, 90),
  slot('branches', 'hero', {
    title: 'Find A Branch Near You',
    subtitle: 'Seven convenient locations across Kolkata with flexible morning and evening training slots.'
  }, 91),
  slot('gallery', 'hero', {
    title: 'Training Gallery',
    subtitle: 'Real moments from scooty, bike and ladies training sessions at Seekho branches across Kolkata.'
  }, 92),
  slot('blog', 'hero', {
    title: 'Riding Tips & Insights',
    subtitle: 'Expert advice on learning scooty, building confidence and riding safely on Kolkata roads.'
  }, 93),
  slot('blog', 'loading', { title: 'Loading article…' }, 93.1),
  slot('faq', 'hero', {
    title: 'Frequently Asked Questions',
    subtitle: 'Everything you need to know about training, timing, vehicles and booking at Seekho.'
  }, 94),
  slot('notfound', 'cta_courses', { title: 'View Courses', cta_link: '/pages/courses.html' }, 100.1),
  slot('notfound', 'cta_contact', { title: 'Contact Us', cta_link: '/pages/contact.html' }, 100.2),
  slot('detail', 'loading', { title: 'Loading…', subtitle: 'Loading details…' }, 101),
  slot('contact', 'label_findus', { title: 'Find us' }, 84.5),
  slot('reviews', 'hero', {
    title: 'Student Reviews & Testimonials',
    subtitle: 'Real stories from riders who went from beginners to confident independent drivers.'
  }, 96),
  slot('reviews', 'label_google', { title: 'Google Reviews' }, 96.1),
  slot('reviews', 'label_facebook', { title: 'Facebook Reviews' }, 96.2),
  slot('reviews', 'label_candidates_trained', { title: 'Candidates Trained' }, 96.3),
  slot('booking', 'hero', {
    title: 'Register & Book Training',
    subtitle: 'Complete the 5-step wizard to book your scooty or bike training session.'
  }, 97),
  slot('booking', 'step1', { title: 'Select Your Course', subtitle: 'Choose the training program that fits your needs.' }, 98),
  slot('booking', 'step2', { title: 'Choose A Branch', subtitle: 'Pick the nearest Seekho branch for your training.' }, 99),
  slot('booking', 'step3', { title: 'Select Date', subtitle: 'Choose your preferred training date.' }, 99.1),
  slot('booking', 'step4', { title: 'Select Time Slot', subtitle: 'Morning and evening slots available.' }, 99.2),
  slot('booking', 'step5', { title: 'Confirm & Submit', cta_text: 'Confirm Booking' }, 99.3),
  slot('booking', 'tab_course', { title: 'Course' }, 99.4),
  slot('booking', 'tab_branch', { title: 'Branch' }, 99.5),
  slot('booking', 'tab_date', { title: 'Date' }, 99.6),
  slot('booking', 'tab_time', { title: 'Time' }, 99.7),
  slot('booking', 'tab_submit', { title: 'Submit' }, 99.8),
  slot('booking', 'nav_back', { title: 'Back' }, 99.81),
  slot('booking', 'nav_next', { title: 'Continue' }, 99.82),
  slot('booking', 'doorstep_widget', {
    title: 'Doorstep training distance',
    subtitle: 'Type kilometres to see the live doorstep scooty price.',
    body_html: 'Distance (km)'
  }, 99.83),
  slot('branches', 'search_cta', { title: 'Book Training', cta_link: '/pages/booking.html' }, 91.1),
  slot('faq', 'cta', {
    title: 'Still have questions?',
    cta_text: 'Contact Us',
    cta_link: '/pages/contact.html'
  }, 95),
  slot('faq', 'cta_book', { title: 'Book Training', cta_link: '/pages/booking.html' }, 95.1),
  slot('notfound', 'hero', {
    title: 'Page Not Found',
    subtitle: "Sorry, the page you're looking for doesn't exist or may have been moved. Let's get you back on track.",
    cta_text: 'Go Home',
    cta_link: '/'
  }, 100),
  slot('privacy', 'hero', { title: 'Privacy Policy', subtitle: 'Last updated: July 2026' }, 110),
  slot('privacy', 'body', {
    body_html: '<p>Seekho Two Wheeler Academy ("we", "us", "our") respects your privacy. This policy explains how we collect, use and safeguard information when you visit our website or use our services.</p><h2>Information We Collect</h2><p>When you book training, submit an enquiry or contact us, we may collect:</p><ul><li>Name, phone number and email address</li><li>Course, branch, date and time preferences</li><li>Messages or notes you provide in forms</li><li>Basic usage data such as pages visited (via session analytics)</li></ul><h2>How We Use Your Information</h2><p>We use your information to:</p><ul><li>Process bookings and respond to enquiries</li><li>Contact you about your training schedule</li><li>Improve our website and services</li><li>Send important updates related to your booking</li></ul><h2>Data Sharing</h2><p>We do not sell your personal information. We may share data with trusted service providers (such as email delivery) solely to operate our services, or when required by law.</p><h2>Data Security</h2><p>We implement reasonable technical and organizational measures to protect your information. However, no method of transmission over the internet is 100% secure.</p><h2>Cookies & Analytics</h2><p>Our website may use session storage and basic visit tracking to improve user experience. You can disable cookies in your browser settings.</p><h2>Your Rights</h2><p>You may request access, correction or deletion of your personal data by contacting us using the email and phone in Site Settings.</p><h2>Contact</h2><p>For privacy-related questions, use the contact details in Site Settings.</p>'
  }, 111),
  slot('terms', 'hero', { title: 'Terms of Service', subtitle: 'Last updated: July 2026' }, 112),
  slot('terms', 'body', {
    body_html: '<p>By using the Seekho Two Wheeler Academy website and booking our training services, you agree to these Terms of Service.</p><h2>Services</h2><p>Seekho Two Wheeler Academy provides scooty, bike and related two-wheeler training across multiple branches in Kolkata. Course content, duration and pricing may vary by branch and individual progress.</p><h2>Bookings</h2><ul><li>Online bookings are subject to confirmation by our team.</li><li>Please provide accurate contact information so we can reach you.</li><li>Selected date and time slots may be rescheduled based on trainer availability or weather conditions.</li><li>We reserve the right to cancel or reschedule sessions with reasonable notice.</li></ul><h2>Payments</h2><p>Course fees are communicated at the time of booking or enrolment. Payment terms, refunds and rescheduling policies will be explained by our staff during confirmation.</p><h2>Student Responsibilities</h2><ul><li>Arrive on time for scheduled sessions with valid identification if required.</li><li>Follow all safety instructions from trainers at all times.</li><li>Inform trainers of any medical conditions that may affect riding ability.</li><li>Wear appropriate clothing and footwear as advised by trainers.</li></ul><h2>Liability</h2><p>While we maintain high safety standards, two-wheeler training involves inherent risks. Students participate at their own risk. Seekho Two Wheeler Academy is not liable for injuries resulting from failure to follow trainer instructions or reckless behaviour.</p><h2>Intellectual Property</h2><p>All website content, branding, images and materials are owned by Seekho Two Wheeler Academy and may not be reproduced without permission.</p><h2>Changes</h2><p>We may update these terms at any time. Continued use of our website constitutes acceptance of updated terms.</p><h2>Contact</h2><p>Questions about these terms? Use the contact details in Site Settings.</p>'
  }, 113)
];

function normalize(row) {
  if (!row) return null;
  return {
    id: row.id,
    page: String(row.page || '').trim(),
    slot: String(row.slot || '').trim(),
    title: row.title || '',
    subtitle: row.subtitle || '',
    body_html: row.body_html || '',
    cta_text: row.cta_text || '',
    cta_link: row.cta_link || '',
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order || 0)
  };
}

async function ensureTab() {
  if (db.allowRuntimeSeed && !db.allowRuntimeSeed()) return;
  if (typeof db.ensureSheetTab === 'function') await db.ensureSheetTab('page_copy');
}

function copyIsBlank(val) {
  return !String(val || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
}

function hydrateFromSeed(rows) {
  const byKey = new Map();
  (rows || []).forEach((r) => {
    const n = normalize(r);
    if (!n || !n.page || !n.slot) return;
    byKey.set(`${n.page}.${n.slot}`, n);
  });
  const out = [];
  COPY_SEED.forEach((seed) => {
    const key = `${seed.page}.${seed.slot}`;
    const existing = byKey.get(key);
    if (!existing) {
      out.push({ ...normalize(seed), id: seed.id, from_seed: true });
    } else {
      out.push({
        ...existing,
        title: copyIsBlank(existing.title) ? seed.title : existing.title,
        subtitle: copyIsBlank(existing.subtitle) ? seed.subtitle : existing.subtitle,
        body_html: copyIsBlank(existing.body_html) ? seed.body_html : existing.body_html,
        cta_text: copyIsBlank(existing.cta_text) ? seed.cta_text : existing.cta_text,
        cta_link: copyIsBlank(existing.cta_link) ? seed.cta_link : existing.cta_link,
        from_seed: false
      });
      byKey.delete(key);
    }
  });
  byKey.forEach((extra) => out.push(extra));
  return out.sort((a, b) => a.sort_order - b.sort_order || a.page.localeCompare(b.page));
}

async function listAll() {
  await ensureTab();
  let rows = await db.getAll('page_copy');
  const persist = !(db.allowRuntimeSeed && !db.allowRuntimeSeed());
  const now = new Date().toISOString();
  if (persist) {
    if (!rows.length) {
      for (const seed of COPY_SEED) {
        await db.create('page_copy', { ...seed, created_at: now, updated_at: now });
      }
      rows = await db.getAll('page_copy');
    } else {
      const have = new Set(rows.map((r) => `${String(r.page || '').trim()}.${String(r.slot || '').trim()}`));
      let added = false;
      for (const seed of COPY_SEED) {
        const key = `${seed.page}.${seed.slot}`;
        if (!have.has(key)) {
          await db.create('page_copy', { ...seed, created_at: now, updated_at: now });
          added = true;
        }
      }
      if (added) rows = await db.getAll('page_copy');
    }
  }
  return hydrateFromSeed(rows);
}

async function listPublic() {
  return (await listAll()).filter((r) => r.is_active !== false);
}

function build(payload, existing) {
  const page = String(payload.page != null ? payload.page : (existing && existing.page) || '').trim();
  const slotKey = String(payload.slot != null ? payload.slot : (existing && existing.slot) || '').trim();
  if (!page || !slotKey) return { ok: false, message: 'Page and slot are required' };
  const now = new Date().toISOString();
  return {
    ok: true,
    row: {
      page,
      slot: slotKey,
      title: payload.title !== undefined ? String(payload.title) : (existing && existing.title) || '',
      subtitle: payload.subtitle !== undefined ? String(payload.subtitle) : (existing && existing.subtitle) || '',
      body_html: payload.body_html !== undefined ? sanitizeHtml(payload.body_html) : (existing && existing.body_html) || '',
      cta_text: payload.cta_text !== undefined ? String(payload.cta_text) : (existing && existing.cta_text) || '',
      cta_link: payload.cta_link !== undefined ? String(payload.cta_link) : (existing && existing.cta_link) || '',
      is_active: payload.is_active !== undefined ? parseBool(payload.is_active, true) : (existing ? existing.is_active !== false : true),
      sort_order: payload.sort_order !== undefined ? Number(payload.sort_order) : (existing ? existing.sort_order : 0),
      created_at: (existing && existing.created_at) || now,
      updated_at: now
    }
  };
}

async function createItem(payload) {
  const built = build(payload, null);
  if (!built.ok) return built;
  const raw = (await db.getAll('page_copy')).map(normalize).filter(Boolean);
  const dup = raw.find((r) => r.page === built.row.page && r.slot === built.row.slot);
  if (dup && dup.id) {
    return updateItem(dup.id, payload);
  }
  const created = await db.create('page_copy', built.row);
  return { ok: true, data: normalize(created) };
}

async function updateItem(id, payload) {
  const raw = (await db.getAll('page_copy')).map(normalize).filter(Boolean);
  let current = raw.find((i) => String(i.id) === String(id));
  if (!current && payload && payload.page && payload.slot) {
    current = raw.find((i) => i.page === payload.page && i.slot === payload.slot);
  }
  if (!current) {
    return createItem(payload);
  }
  const built = build(payload, current);
  if (!built.ok) return built;
  const saved = await db.update('page_copy', current.id, { ...built.row, id: current.id });
  return { ok: true, data: normalize(saved || { ...current, ...built.row }) };
}

async function removeItem(id) {
  return db.remove('page_copy', id);
}

module.exports = { COPY_SEED, listAll, listPublic, createItem, updateItem, removeItem };
