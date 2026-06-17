const fetch = require('node-fetch');

async function verifyRecaptcha(token, expectedAction = null) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`
    });

    const data = await res.json();

    if (!data.success) return false;

    if (data.score !== undefined) {
      if (data.score < 0.5) return false;
      if (expectedAction && data.action !== expectedAction) return false;
    }

    if (process.env.NODE_ENV === 'production') {
      const allowedHosts = (process.env.RECAPTCHA_ALLOWED_HOSTS || '').split(',');
      if (allowedHosts.length && !allowedHosts.includes(data.hostname)) {
        return false;
      }
    }

    return true;

  } catch (err) {
    console.error('reCAPTCHA verification failed:', err.message);
    return process.env.NODE_ENV !== 'production';
  }
}

// NOT async — must return the middleware function synchronously
function requireRecaptcha(action = null) {
  return async (req, res, next) => {
    const token = req.body['g-recaptcha-response'];

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'reCAPTCHA harus diselesaikan.' 
      });
    }

    const valid = await verifyRecaptcha(token, action);
    if (!valid) {
      return res.status(400).json({ 
        success: false, 
        message: 'reCAPTCHA tidak valid, coba lagi.' 
      });
    }

    next();
  };
}

module.exports = requireRecaptcha;