const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

// Host creating invites — keyed by logged-in user id, falls back to IP-safe key
const createInviteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req.ip),
  message: { message: "Too many invite links created. Please wait before generating another." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Guests joining/messaging — keyed by IP-safe key since there's no user
const guestActionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { createInviteLimiter, guestActionLimiter };