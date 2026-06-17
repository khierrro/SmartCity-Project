const rateLimit = require('express-rate-limit');

// Auth: login/register — strict, 5 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Terlalu banyak percobaan, coba lagi nanti.' }
});

// Read (GET) — generous, just prevents scraping
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,  // 1 per second average
  message: { success: false, message: 'Terlalu banyak permintaan, tunggu sebentar.' }
});

// Write (POST/PUT/DELETE) — moderate
const actionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Terlalu banyak aksi, silakan tunggu sebentar.' }
});

// Strict — for comments/votes/flags specifically
const strictActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak aksi, silakan tunggu sebentar.' }
});

module.exports = { authLimiter, readLimiter, actionLimiter, strictActionLimiter };