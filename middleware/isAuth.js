module.exports = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  if (req.originalUrl.startsWith('/api')) {
    return res.status(401).json({ success: false, message: 'Silakan login' });
  }
  res.redirect('/login.html');
};