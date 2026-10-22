const rateLimit = require('express-rate-limit');

// General API Rate Limiter: Allows generous traffic for campus students, blocks DDoS & bot scrapers
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this device. Please slow down and try again in a few moments.',
  },
});

// Strict Auth Limiter: Protects login/register against brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
});

// Order Placement Limiter: Prevents double-taps and automated rush spam
const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // Max 15 orders per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Order creation rate exceeded. Please wait a moment before placing another order.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  orderLimiter,
};
