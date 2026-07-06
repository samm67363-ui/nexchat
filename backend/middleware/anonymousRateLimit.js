// backend/middleware/anonymousRateLimit.js
const rateLimit = require("express-rate-limit");

// Host creating invites — keyed by logged-in user id
const createInviteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // max 5 invite links per 10 min per user
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: { message: "Too many invite links created. Please wait before generating another." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Guests joining/messaging — keyed by IP since there's no user
const guestActionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // generous, just anti-abuse
  keyGenerator: (req) => req.ip,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { createInviteLimiter, guestActionLimiter };