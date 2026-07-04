const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  generateInvite,
  validateInvite,
  joinInvite,
} = require("../controllers/inviteController");

// Generate a new invite link
router.post("/generate", protect, generateInvite);

// Validate an invite link (check if valid before joining)
router.get("/:code", validateInvite);

// Join using an invite link
router.post("/:code/join", protect, joinInvite);

module.exports = router;