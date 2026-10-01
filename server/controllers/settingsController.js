const db = require('../services/db');
const config = require('../config');
const { parseBool } = require('../utils/sanitizeHtml');
const { applyLocationFields } = require('../utils/geo');

const DEFAULT_SETTINGS = {
  siteName: 'Seekho Two Wheeler Academy',
  tagline: 'Empowering Independence Through Safe Riding',
  phones: config.contact.phones,
  whatsapp: config.contact.whatsapp,
  email: 'info@seekhoacademy.com',
  address: 'Kolkata, West Bengal',
  gmb_url: '',
  latitude: '',
  longitude: '',
  map_embed_url: '',
  facebookUrl: process.env.FACEBOOK_URL || '',
  instagramUrl: process.env.INSTAGRAM_URL || '',
  youtubeUrl: process.env.YOUTUBE_URL || '',
  googleRating: 4.9,
  facebookRating: 4.8,
  reviewCount: 500,
  workingHours: 'Mon – Sun: 7:00 AM – 7:00 PM',
  trainedCandidates: '5000+',
  foundedYear: '2018',
  header_cta_text: 'Register & Book',
  header_cta_link: '/pages/booking.html',
  footer_cta_title: 'Ready To Start Your Riding Journey?',
  footer_cta_text: 'Join thousands of confident riders trained at Seekho Two Wheeler Academy.',
  footer_cta_button: 'Register & Book Now',
  copyright_text: 'Seekho Two Wheeler Academy. All rights reserved.',
  logo_subline: 'ACADEMY · KOLKATA'
};

exports.getPublic = async (req, res, next) => {
  try {
    const rows = await db.getAll('settings');
    const settings = rows[0] ? { ...DEFAULT_SETTINGS, ...rows[0] } : DEFAULT_SETTINGS;
    // Don't expose internal ids unnecessarily beyond needed
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

exports.getAdmin = async (req, res, next) => {
  try {
    const rows = await db.getAll('settings');
    const settings = rows[0] ? { ...DEFAULT_SETTINGS, ...rows[0] } : { ...DEFAULT_SETTINGS };
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const rows = await db.getAll('settings');
    const payload = { ...req.body };
    if (payload.tagline_bold !== undefined) payload.tagline_bold = parseBool(payload.tagline_bold);
    const loc = applyLocationFields(payload, { includeEmbed: true });
    if (!loc.ok) return res.status(400).json({ success: false, message: loc.message });
    let settings;
    if (rows[0]) {
      settings = await db.update('settings', rows[0].id, payload);
    } else {
      settings = await db.create('settings', { ...DEFAULT_SETTINGS, ...payload });
    }
    res.json({ success: true, message: 'Settings saved', data: settings });
  } catch (err) {
    next(err);
  }
};

exports.trackVisit = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const visits = await db.getAll('visits');
    const existing = visits.find((v) => v.date === today);
    if (existing) {
      await db.update('visits', existing.id, { count: Number(existing.count || 0) + 1 });
    } else {
      await db.create('visits', { date: today, count: 1 });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
