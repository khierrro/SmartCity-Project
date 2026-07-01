const fetch = require('node-fetch');
const https = require('https');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

const siteverifyAgent = new https.Agent({ keepAlive: false, family: 4 });

async function callSiteverify(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`,
      agent: siteverifyAgent,
      signal: controller.signal,
    });
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyRecaptcha(token, expectedAction = null) {
  let data;
  try {
    data = await callSiteverify(token);
  } catch (err) {
    console.warn('siteverify network error, retrying once:', err.message);
    try {
      data = await callSiteverify(token);
    } catch (err2) {
      console.error('siteverify failed after retry:', err2.message);
      return process.env.NODE_ENV !== 'production';
    }
  }

  if (!data.success) {
    console.error('reCAPTCHA rejected:', data['error-codes']);
    return false;
  }

  if (data.score !== undefined) {
    if (data.score < 0.5) return false;
    if (expectedAction && data.action !== expectedAction) return false;
  }

  if (process.env.NODE_ENV === 'production') {
    const allowedHosts = (process.env.RECAPTCHA_ALLOWED_HOSTS || '')
      .split(',').map(h => h.trim()).filter(Boolean);
    console.log('recaptcha hostname from Google:', data.hostname, '| allowed:', allowedHosts);
    if (allowedHosts.length && !allowedHosts.includes(data.hostname)) {
      return false;
    }
  }

  return true;
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