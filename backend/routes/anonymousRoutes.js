// backend/routes/anonymousRoutes.js  (updated — add report route)
const express = require("express");
const router = express.Router();

const {
  createInvite, validateInvite, joinInvite, reportRoom,
} = require("../controllers/anonymousController");
const { createInviteLimiter, guestActionLimiter } = require("../middleware/anonymousRateLimit");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/invite", authMiddleware, createInviteLimiter, createInvite);
router.get("/invite/:code", guestActionLimiter, validateInvite);
router.post("/invite/:code/join", guestActionLimiter, joinInvite);
router.post("/room/:roomId/report", guestActionLimiter, reportRoom); // new

module.exports = router;