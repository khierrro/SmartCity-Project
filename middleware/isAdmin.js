module.exports = (req, res, next) => {
  // Asumsikan user sudah login dan data user ada di req.user (dari session/JWT)
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Akses ditolak. Hanya admin.' });
  }
};