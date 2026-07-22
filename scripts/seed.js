/**
 * Seed default content using local optimized academy photos
 */
require('dotenv').config();

const isMain = require.main === module;

async function seed() {
  const { ensureAdmin } = require('../server/services/auth');
  const { ensureDataFiles, replaceAll } = require('../server/services/localStore');

  ensureDataFiles();
  await ensureAdmin();

  const g = (n) => `/images/gallery/seekho-${String(n).padStart(2, '0')}.webp`;
  const b = (n) => `/images/banners/seekho-${String(n).padStart(2, '0')}.webp`;
  const c = (n) => `/images/courses/seekho-${String(n).padStart(2, '0')}.webp`;
  const br = (n) => `/images/branches/seekho-${String(n).padStart(2, '0')}.webp`;
  const bl = (n) => `/images/blogs/seekho-${String(n).padStart(2, '0')}.webp`;
  const t = (n) => `/images/testimonials-safe/seekho-${String(n).padStart(2, '0')}.webp`;
  const now = new Date().toISOString();

  await replaceAll('banners', [
    { id: 'banner-1', title: 'Choose Perfect Training For Your Journey', subtitle: 'Learn scooty and bike riding with confidence.', ctaText: 'Book Training', ctaLink: '/pages/booking.html', image: b(1), displayOrder: 1, active: true, createdAt: now, updatedAt: now },
    { id: 'banner-2', title: 'Women Empowerment Starts Here', subtitle: 'Every woman deserves freedom and confidence.', ctaText: 'Start Learning', ctaLink: '/pages/booking.html', image: b(7), displayOrder: 2, active: true, createdAt: now, updatedAt: now },
    { id: 'banner-3', title: 'From Beginner To Road Ready', subtitle: 'Expert trainers with practical lessons.', ctaText: 'Explore Courses', ctaLink: '/pages/courses.html', image: b(3), displayOrder: 3, active: true, createdAt: now, updatedAt: now },
    { id: 'banner-4', title: 'Thousands Trained Successfully', subtitle: "Join Kolkata's trusted riding academy.", ctaText: 'Join Today', ctaLink: '/pages/booking.html', image: b(5), displayOrder: 4, active: true, createdAt: now, updatedAt: now },
    { id: 'banner-5', title: 'Ride Without Fear', subtitle: 'Confidence begins with your first lesson.', ctaText: 'Get Started', ctaLink: '/pages/booking.html', image: b(2), displayOrder: 5, active: true, createdAt: now, updatedAt: now }
  ]);

  await replaceAll('pricing', [
    { id: 'price-1', courseName: 'Scooty Training', price: 2500, duration: '10–15 Days', description: 'Perfect for beginners — balance, control, traffic basics and confident city riding.', image: c(1), features: ['Non-cyclists welcome', 'Female-friendly trainers', 'Flexible timing', 'Certificate guidance'], displayOrder: 1, active: true, createdAt: now, updatedAt: now },
    { id: 'price-2', courseName: 'Bike Training', price: 3000, duration: '12–18 Days', description: 'Gear shifting, clutch control, balance and real-road motorcycle practice.', image: c(3), features: ['Clutch mastery', 'Gear practice', 'Road confidence', 'Patient trainers'], displayOrder: 2, active: true, createdAt: now, updatedAt: now },
    { id: 'price-3', courseName: 'Ladies Training', price: 2500, duration: '10–15 Days', description: 'Specially designed sessions for women — safe, supportive and empowering.', image: c(7), features: ['Women-first batches', 'Safe environment', 'Confidence building', 'Scooty & bike options'], displayOrder: 3, active: true, createdAt: now, updatedAt: now },
    { id: 'price-4', courseName: 'Electric Vehicle Training', price: 2800, duration: '8–12 Days', description: 'Learn to ride electric scooties with modern controls and city practice.', image: c(4), features: ['EV basics', 'Throttle control', 'Battery awareness', 'City routes'], displayOrder: 4, active: true, createdAt: now, updatedAt: now },
    { id: 'price-5', courseName: 'Road Practice', price: 2000, duration: '5–8 Days', description: 'Real traffic exposure with trainer guidance for everyday independence.', image: c(5), features: ['Live traffic', 'Signal practice', 'Lane discipline', 'Defensive riding'], displayOrder: 5, active: true, createdAt: now, updatedAt: now },
    { id: 'price-6', courseName: 'RTO Practice', price: 1500, duration: '3–5 Days', description: 'Focused practice for RTO driving test routes and requirements.', image: c(6), features: ['Test track drills', 'Figure-8 practice', 'Document guidance', 'Mock tests'], displayOrder: 6, active: true, createdAt: now, updatedAt: now }
  ]);

  await replaceAll('branches', [
    { id: 'branch-1', name: 'Tollygunge Branch', area: 'Tollygunge', address: 'Near Metro Station, Tollygunge, Kolkata', mapsLink: 'https://maps.google.com/?q=Tollygunge+Kolkata', phone: '9748481630', whatsapp: '9748481630', availableCourses: ['Scooty Training', 'Bike Training', 'Ladies Training', 'Road Practice'], trainerCount: 6, image: br(1), active: true, createdAt: now, updatedAt: now },
    { id: 'branch-2', name: 'New Town Branch', area: 'New Town', address: 'Action Area, New Town, Kolkata', mapsLink: 'https://maps.google.com/?q=New+Town+Kolkata', phone: '7980108587', whatsapp: '7980108587', availableCourses: ['Scooty Training', 'Bike Training', 'Electric Vehicle Training', 'RTO Practice'], trainerCount: 5, image: br(2), active: true, createdAt: now, updatedAt: now },
    { id: 'branch-3', name: 'Barasat Branch', area: 'Barasat', address: 'Barasat, North 24 Parganas, Kolkata', mapsLink: 'https://maps.google.com/?q=Barasat+Kolkata', phone: '7980110273', whatsapp: '7980110273', availableCourses: ['Scooty Training', 'Ladies Training', 'Bike Training'], trainerCount: 4, image: br(3), active: true, createdAt: now, updatedAt: now },
    { id: 'branch-4', name: 'Sodepur Branch', area: 'Sodepur', address: 'Sodepur, Kolkata', mapsLink: 'https://maps.google.com/?q=Sodepur+Kolkata', phone: '9748481630', whatsapp: '9748481630', availableCourses: ['Scooty Training', 'Bike Training', 'Road Practice', 'RTO Practice'], trainerCount: 4, image: br(5), active: true, createdAt: now, updatedAt: now }
  ]);

  const categories = ['Scooty Training', 'Women Riders', 'Bike Training', 'Student Success', 'Road Practice', 'Branch Activities', 'Women Riders'];
  await replaceAll('gallery', [1, 2, 3, 4, 5, 6, 7].map((n, i) => ({
    id: `gal-${n}`,
    title: `Training moment ${n}`,
    category: categories[i],
    image: g(n),
    displayOrder: n,
    active: true,
    createdAt: now,
    updatedAt: now
  })));

  await replaceAll('blogs', [
    { id: 'blog-1', title: 'How to Learn Scooty Without Knowing Cycle', slug: 'how-to-learn-scooty-without-knowing-cycle', featuredImage: bl(1), metaTitle: 'Learn Scooty Without Cycle | Seekho Academy Kolkata', metaDescription: 'Non-cyclists can learn scooty riding safely. Step-by-step tips from Seekho Two Wheeler Academy trainers in Kolkata.', content: `<p>Many students believe they must know cycling before learning scooty. At Seekho, that is not true.</p><p>Our trainers start with balance drills, slow control, and gradual traffic exposure — designed especially for non-cyclists and women beginners.</p>`, status: 'published', scheduledAt: null, publishedAt: now, createdAt: now, updatedAt: now },
    { id: 'blog-2', title: 'How to Learn Scooty Fast', slug: 'how-to-learn-scooty-fast', featuredImage: bl(2), metaTitle: 'How to Learn Scooty Fast | Seekho Two Wheeler Academy', metaDescription: 'Practical tips to learn scooty riding faster with professional training in Kolkata.', content: `<p>Consistency beats intensity. Short, focused sessions with a professional trainer help you progress faster.</p>`, status: 'published', scheduledAt: null, publishedAt: now, createdAt: now, updatedAt: now },
    { id: 'blog-3', title: 'Why Women Should Learn Two Wheeler Riding', slug: 'why-women-should-learn-two-wheeler-riding', featuredImage: bl(7), metaTitle: 'Women Two Wheeler Training Kolkata | Seekho Academy', metaDescription: 'Riding builds independence, confidence and freedom. Discover why women across Kolkata choose Seekho.', content: `<p>Learning to ride is more than a skill — it is independence. Seekho provides a female-friendly environment so every woman can ride without fear.</p>`, status: 'published', scheduledAt: null, publishedAt: now, createdAt: now, updatedAt: now }
  ]);

  await replaceAll('faqs', [
    { id: 'faq-1', question: 'আমি সাইকেল চালাতে পারি না — স্কুটি শিখতে পারবো?', answer: 'হ্যাঁ! Seekho-তে non-cyclists-দের জন্য বিশেষ ট্রেনিং আছে। হাজারো শিক্ষার্থী সাইকেল না জেনেই স্কুটি ও বাইক শিখেছেন।', displayOrder: 1, active: true, createdAt: now, updatedAt: now },
    { id: 'faq-2', question: 'Can women learn in a safe environment?', answer: 'Absolutely. We offer female-friendly batches, patient trainers, and a supportive atmosphere focused on confidence and safety.', displayOrder: 2, active: true, createdAt: now, updatedAt: now },
    { id: 'faq-3', question: 'What is the course duration and timing?', answer: 'Duration depends on your progress. We offer flexible morning and evening slots across multiple Kolkata branches.', displayOrder: 3, active: true, createdAt: now, updatedAt: now },
    { id: 'faq-4', question: 'Do you provide vehicles for training?', answer: 'Yes. Multiple scooties and bikes are available at each branch so you can practice on academy vehicles.', displayOrder: 4, active: true, createdAt: now, updatedAt: now },
    { id: 'faq-5', question: 'Is road / traffic practice included?', answer: 'Yes. After basic control, trainers take students for guided real-traffic practice so you become road-ready.', displayOrder: 5, active: true, createdAt: now, updatedAt: now },
    { id: 'faq-6', question: 'How do I book a training slot?', answer: 'Use the Register & Book form on our website, call us, or WhatsApp 9748481630. Choose course, branch, date and time.', displayOrder: 6, active: true, createdAt: now, updatedAt: now }
  ]);

  await replaceAll('testimonials', [
    { id: 'rev-1', name: 'Priya Banerjee', headline: 'Non-Cyclist to Confident Rider', review: 'I never rode a cycle, yet within weeks I was riding scooty alone to work. Trainers were so patient.', rating: 5, photo: t(1), videoUrl: '', type: 'text', displayOrder: 1, active: true, createdAt: now, updatedAt: now },
    { id: 'rev-2', name: 'Ananya Das', headline: 'Housewife to Independent Rider', review: 'Seekho gave me freedom. Now I drop my kids to school myself. Best decision for my confidence.', rating: 5, photo: t(7), videoUrl: '', type: 'video', displayOrder: 2, active: true, createdAt: now, updatedAt: now },
    { id: 'rev-3', name: 'Riya Chatterjee', headline: 'From Fear to Freedom', review: 'Ladies batch felt safe and supportive. Road practice built real confidence in Kolkata traffic.', rating: 5, photo: t(2), videoUrl: '', type: 'text', displayOrder: 3, active: true, createdAt: now, updatedAt: now },
    { id: 'rev-4', name: 'Sourav Ghosh', headline: 'Bike Training Done Right', review: 'Clutch and gear control were taught step by step. Highly recommend for absolute beginners.', rating: 5, photo: t(3), videoUrl: '', type: 'text', displayOrder: 4, active: true, createdAt: now, updatedAt: now }
  ]);

  await replaceAll('settings', [{
    id: 'settings-1',
    siteName: 'Seekho Two Wheeler Academy',
    tagline: 'Empowering Independence Through Safe Riding',
    phones: ['9748481630', '7980108587', '7980110273'],
    whatsapp: '9748481630',
    email: 'info@seekhoacademy.com',
    address: 'Multiple Branches Across Kolkata',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    youtubeUrl: 'https://youtube.com',
    googleRating: 4.9,
    facebookRating: 4.8,
    reviewCount: 500,
    workingHours: 'Mon – Sun: 7:00 AM – 7:00 PM',
    trainedCandidates: '5000+',
    foundedYear: '2018',
    createdAt: now,
    updatedAt: now
  }]);

  console.log('✓ Seed data written with local academy photos');
  if (isMain) process.exit(0);
}

module.exports = seed;

if (isMain) {
  seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
