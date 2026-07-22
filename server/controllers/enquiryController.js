const db = require('../services/db');
const { notifyEnquiry } = require('../services/email');

exports.create = async (req, res, next) => {
  try {
    const { name, phone, email, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ success: false, message: 'Name, phone, and message are required' });
    }

    const phoneClean = String(phone).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }

    const enquiry = await db.create('enquiries', {
      name: name.trim(),
      phone: phoneClean,
      email: email || '',
      message: message.trim(),
      status: 'new'
    });

    await db.create('notifications', {
      type: 'enquiry',
      title: 'New Enquiry',
      message: `${enquiry.name}: ${enquiry.message.slice(0, 80)}`,
      refId: enquiry.id,
      read: false
    });

    notifyEnquiry(enquiry).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Thank you! Your enquiry has been received. We will call you soon.'
    });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const enquiries = await db.getAll('enquiries');
    enquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: enquiries });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const enquiry = await db.update('enquiries', req.params.id, { status: req.body.status || 'read' });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, message: 'Enquiry updated', data: enquiry });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await db.remove('enquiries', req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (err) {
    next(err);
  }
};
