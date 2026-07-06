// backend/routes/anonymousRoutes.js  (updated — add report route)
const express = require("express");
const router = express.Router();

const {
  createInvite, validateInvite, joinInvite, reportRoom,
} = require("../controllers/anonymousController");
const { createInviteLimiter, guestActionLimiter } = require("../middleware/anonymousRateLimit");
const { protect } = require("../middleware/auth");
router.post("/invite", protect, createInviteLimiter, createInvite);
router.get("/invite/:code", guestActionLimiter, validateInvite);
router.post("/invite/:code/join", guestActionLimiter, joinInvite);
router.post("/room/:roomId/report", guestActionLimiter, reportRoom); // new

module.exports = router;