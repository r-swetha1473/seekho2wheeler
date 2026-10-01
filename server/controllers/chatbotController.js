const {
  getConfig,
  saveConfig,
  listQa,
  createQa,
  updateQa,
  removeQa,
  listUnanswered,
  ask
} = require('../services/chatbot');

exports.getPublicConfig = async (req, res, next) => {
  try {
    const config = await getConfig();
    res.json({
      success: true,
      data: {
        greeting: config.greeting,
        quick_replies: config.quick_replies
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.ask = async (req, res, next) => {
  try {
    const result = await ask(req.body && req.body.message, {
      logMiss: true,
      history: req.body && req.body.history
    });
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.test = async (req, res, next) => {
  try {
    const result = await ask(req.body && req.body.message, {
      logMiss: false,
      history: req.body && req.body.history
    });
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getAdminBundle = async (req, res, next) => {
  try {
    const [config, items, unanswered] = await Promise.all([
      getConfig(),
      listQa(true),
      listUnanswered()
    ]);
    res.json({ success: true, data: { config, items, unanswered } });
  } catch (err) {
    next(err);
  }
};

exports.updateConfig = async (req, res, next) => {
  try {
    const result = await saveConfig(req.body || {});
    res.json({ success: true, message: 'Chatbot settings saved', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.listQa = async (req, res, next) => {
  try {
    res.json({ success: true, data: await listQa(true) });
  } catch (err) {
    next(err);
  }
};

exports.createQa = async (req, res, next) => {
  try {
    const result = await createQa(req.body || {});
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.status(201).json({ success: true, message: 'Q&A created', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.updateQa = async (req, res, next) => {
  try {
    const result = await updateQa(req.params.id, req.body || {});
    if (!result.ok) return res.status(result.status || 400).json({ success: false, message: result.message });
    res.json({ success: true, message: 'Q&A updated', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.removeQa = async (req, res, next) => {
  try {
    const ok = await removeQa(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Q&A not found' });
    res.json({ success: true, message: 'Q&A deleted' });
  } catch (err) {
    next(err);
  }
};

exports.listUnanswered = async (req, res, next) => {
  try {
    res.json({ success: true, data: await listUnanswered() });
  } catch (err) {
    next(err);
  }
};
