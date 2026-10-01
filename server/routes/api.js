const express = require('express');
const { authRequired } = require('../middleware/auth');
const { upload } = require('../services/upload');

const auth = require('../controllers/authController');
const banners = require('../controllers/bannerController');
const gallery = require('../controllers/galleryController');
const blogs = require('../controllers/blogController');
const branches = require('../controllers/branchController');
const pricing = require('../controllers/pricingController');
const bookings = require('../controllers/bookingController');
const enquiries = require('../controllers/enquiryController');
const faqs = require('../controllers/faqController');
const testimonials = require('../controllers/testimonialController');
const settings = require('../controllers/settingsController');
const doorstep = require('../controllers/doorstepController');
const homeSections = require('../controllers/homeSectionController');
const detailPages = require('../controllers/detailPageController');
const whyChoose = require('../controllers/whyChooseController');
const chatbot = require('../controllers/chatbotController');
const updates = require('../controllers/updateController');
const pageCopy = require('../controllers/pageCopyController');
const dashboard = require('../controllers/dashboardController');

const router = express.Router();

/* ---------- Public ---------- */
router.post('/auth/login', auth.login);
router.get('/banners', banners.listPublic);
router.get('/gallery', gallery.listPublic);
router.get('/blogs', blogs.listPublic);
router.get('/blogs/:slug', blogs.getBySlug);
router.get('/branches', branches.listPublic);
router.get('/pricing', pricing.listPublic);
router.get('/doorstep/config', doorstep.getConfig);
router.get('/doorstep/price', doorstep.getPrice);
router.get('/content-limits', homeSections.getLimits);
router.get('/home-sections', homeSections.listPublic);
router.get('/home-sections/:key', homeSections.getPublicByKey);
router.get('/pages/:slug', detailPages.getPublic);
router.get('/why-choose', whyChoose.listPublic);
router.get('/chatbot/config', chatbot.getPublicConfig);
router.post('/chatbot/ask', chatbot.ask);
router.get('/updates', updates.listPublic);
router.get('/page-copy', pageCopy.listPublic);
router.get('/faqs', faqs.listPublic);
router.get('/testimonials', testimonials.listPublic);
router.get('/settings', settings.getPublic);
router.post('/visits', settings.trackVisit);
router.get('/bookings/slots', bookings.getSlots);
router.post('/bookings', bookings.create);
router.post('/enquiries', enquiries.create);

/* ---------- Admin Auth ---------- */
router.get('/auth/me', authRequired, auth.me);
router.post('/auth/change-password', authRequired, auth.changePassword);

/* ---------- Admin Dashboard ---------- */
router.get('/admin/stats', authRequired, dashboard.stats);
router.get('/admin/notifications', authRequired, dashboard.notifications);
router.patch('/admin/notifications/:id/read', authRequired, dashboard.markRead);

/* ---------- Admin CRUD ---------- */
router.get('/admin/banners', authRequired, banners.listAdmin);
router.post('/admin/banners', authRequired, upload.single('image'), banners.create);
router.put('/admin/banners/:id', authRequired, upload.single('image'), banners.update);
router.delete('/admin/banners/:id', authRequired, banners.remove);
router.post('/admin/banners/reorder', authRequired, banners.reorder);

router.get('/admin/gallery', authRequired, gallery.listAdmin);
router.post('/admin/gallery', authRequired, upload.array('images', 20), gallery.create);
router.put('/admin/gallery/:id', authRequired, upload.single('image'), gallery.update);
router.delete('/admin/gallery/:id', authRequired, gallery.remove);
router.post('/admin/gallery/reorder', authRequired, gallery.reorder);

router.get('/admin/blogs', authRequired, blogs.listAdmin);
router.post('/admin/blogs', authRequired, upload.single('featuredImage'), blogs.create);
router.put('/admin/blogs/:id', authRequired, upload.single('featuredImage'), blogs.update);
router.delete('/admin/blogs/:id', authRequired, blogs.remove);

router.get('/admin/branches', authRequired, branches.listAdmin);
router.post('/admin/branches', authRequired, upload.single('image'), branches.create);
router.put('/admin/branches/:id', authRequired, upload.single('image'), branches.update);
router.delete('/admin/branches/:id', authRequired, branches.remove);

router.get('/admin/pricing', authRequired, pricing.listAdmin);
router.post('/admin/pricing', authRequired, upload.single('image'), pricing.create);
router.put('/admin/pricing/:id', authRequired, upload.single('image'), pricing.update);
router.delete('/admin/pricing/:id', authRequired, pricing.remove);

router.get('/admin/doorstep-pricing', authRequired, doorstep.getConfig);
router.put('/admin/doorstep-pricing', authRequired, doorstep.updateConfig);

router.get('/admin/home-sections', authRequired, homeSections.listAdmin);
router.get('/admin/home-sections/:key', authRequired, homeSections.getAdminByKey);
router.put('/admin/home-sections/:key', authRequired, upload.single('image'), homeSections.updateByKey);

router.get('/admin/detail-pages', authRequired, detailPages.listAdmin);
router.post('/admin/detail-pages', authRequired, upload.single('image'), detailPages.create);
router.put('/admin/detail-pages/:id', authRequired, upload.single('image'), detailPages.update);
router.delete('/admin/detail-pages/:id', authRequired, detailPages.remove);

router.get('/admin/why-choose', authRequired, whyChoose.listAdmin);
router.post('/admin/why-choose', authRequired, whyChoose.create);
router.put('/admin/why-choose/:id', authRequired, whyChoose.update);
router.delete('/admin/why-choose/:id', authRequired, whyChoose.remove);

router.get('/admin/chatbot', authRequired, chatbot.getAdminBundle);
router.put('/admin/chatbot/config', authRequired, chatbot.updateConfig);
router.post('/admin/chatbot/test', authRequired, chatbot.test);
router.get('/admin/chatbot/unanswered', authRequired, chatbot.listUnanswered);
router.get('/admin/chatbot/qa', authRequired, chatbot.listQa);
router.post('/admin/chatbot/qa', authRequired, chatbot.createQa);
router.put('/admin/chatbot/qa/:id', authRequired, chatbot.updateQa);
router.delete('/admin/chatbot/qa/:id', authRequired, chatbot.removeQa);

router.get('/admin/updates', authRequired, updates.listAdmin);
router.post('/admin/updates', authRequired, upload.single('image'), updates.create);
router.put('/admin/updates/:id', authRequired, upload.single('image'), updates.update);
router.delete('/admin/updates/:id', authRequired, updates.remove);

router.get('/admin/page-copy', authRequired, pageCopy.listAdmin);
router.post('/admin/page-copy', authRequired, pageCopy.create);
router.put('/admin/page-copy/:id', authRequired, pageCopy.update);
router.delete('/admin/page-copy/:id', authRequired, pageCopy.remove);

router.get('/admin/bookings', authRequired, bookings.listAdmin);
router.patch('/admin/bookings/:id/status', authRequired, bookings.updateStatus);
router.delete('/admin/bookings/:id', authRequired, bookings.remove);

router.get('/admin/enquiries', authRequired, enquiries.listAdmin);
router.patch('/admin/enquiries/:id/status', authRequired, enquiries.updateStatus);
router.delete('/admin/enquiries/:id', authRequired, enquiries.remove);

router.get('/admin/faqs', authRequired, faqs.listAdmin);
router.post('/admin/faqs', authRequired, faqs.create);
router.put('/admin/faqs/:id', authRequired, faqs.update);
router.delete('/admin/faqs/:id', authRequired, faqs.remove);

router.get('/admin/testimonials', authRequired, testimonials.listAdmin);
router.post('/admin/testimonials', authRequired, upload.single('photo'), testimonials.create);
router.put('/admin/testimonials/:id', authRequired, upload.single('photo'), testimonials.update);
router.delete('/admin/testimonials/:id', authRequired, testimonials.remove);

router.get('/admin/settings', authRequired, settings.getAdmin);
router.put('/admin/settings', authRequired, settings.update);

module.exports = router;
