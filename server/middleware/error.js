function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Image is too large. Max 5MB allowed.' });
  }
  const status = err.status || 500;
  const isLogin = req.path === '/auth/login' || req.originalUrl === '/api/auth/login';
  if (isLogin && status >= 500) {
    return res.status(503).json({
      success: false,
      message: err.publicMessage || 'Unable to sign in right now. Storage is not ready.'
    });
  }
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.publicMessage || err.message || 'Something went wrong. Please try again.';
  res.status(status).json({ success: false, message });
}

function notFound(req, res) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.status(404).sendFile(require('path').join(__dirname, '../../public/pages/404.html'));
}

module.exports = { errorHandler, notFound };
