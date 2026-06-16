
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20,                    
  message: { success: false, message: 'Terlalu banyak percobaan, coba lagi nanti.' }
});

const actionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  
  max: 10,                    
  message: { success: false, message: 'Terlalu banyak aksi, silakan tunggu sebentar.' }
});

module.exports = { authLimiter, actionLimiter };