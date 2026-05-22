const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15 min (prod) or 60 min (dev)
  max: process.env.NODE_ENV === 'production' ? 1000 : 500, // 1000 (prod) or 500 (dev) requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

module.exports = { rateLimiter };
