const { actionLimiter } = require('./rateLimiter');

module.exports = (req, res, next) => {
  if (req.method !== 'GET') {
    return actionLimiter(req, res, next);
  }
  next();
};