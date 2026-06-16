const fetch = require('node-fetch'); // atau gunakan built‑in fetch Node.js ≥18
async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const res = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}`
  });
  const data = await res.json();
  return data.success;
}

// Middleware untuk rute yang ingin dilindungi reCAPTCHA
async function requireRecaptcha(req, res, next) {
  const token = req.body['g-recaptcha-response'];
  if (!token) {
    return res.status(400).json({ success: false, message: 'reCAPTCHA harus diselesaikan.' });
  }
  const valid = await verifyRecaptcha(token);
  if (!valid) {
    return res.status(400).json({ success: false, message: 'reCAPTCHA tidak valid, coba lagi.' });
  }
  next();
}

module.exports = requireRecaptcha;