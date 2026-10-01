const db = require('../services/db');
const { sanitizeHtml, parseBool } = require('../utils/sanitizeHtml');

exports.listPublic = async (req, res, next) => {
  try {
    let faqs = await db.getAll('faqs');
    faqs = faqs.filter((f) => f.active !== false);
    faqs.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    res.json({ success: true, data: faqs });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const faqs = await db.getAll('faqs');
    faqs.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    res.json({ success: true, data: faqs });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { question, answer, displayOrder, active } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }
    const faq = await db.create('faqs', {
      question,
      answer: sanitizeHtml(answer),
      displayOrder: Number(displayOrder || 0),
      active: active !== 'false' && active !== false,
      title_bold: parseBool(req.body.title_bold)
    });
    res.status(201).json({ success: true, message: 'FAQ created', data: faq });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.answer !== undefined) payload.answer = sanitizeHtml(payload.answer);
    if (payload.title_bold !== undefined) payload.title_bold = parseBool(payload.title_bold);
    const faq = await db.update('faqs', req.params.id, payload);
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.json({ success: true, message: 'FAQ updated', data: faq });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await db.remove('faqs', req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (err) {
    next(err);
  }
};
