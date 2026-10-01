const {
  calculateDoorstepPrice,
  getDoorstepConfig,
  saveDoorstepConfig
} = require('../services/doorstep');

exports.getConfig = async (req, res, next) => {
  try {
    const config = await getDoorstepConfig();
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

exports.getPrice = async (req, res, next) => {
  try {
    const config = await getDoorstepConfig();
    const result = calculateDoorstepPrice(req.query.km, config);
    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    res.json({
      success: true,
      km: result.km,
      price: result.price,
      currency: result.currency,
      data: { km: result.km, price: result.price, currency: result.currency }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateConfig = async (req, res, next) => {
  try {
    const result = await saveDoorstepConfig(req.body || {});
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: 'Doorstep pricing saved', data: result.data });
  } catch (err) {
    next(err);
  }
};
