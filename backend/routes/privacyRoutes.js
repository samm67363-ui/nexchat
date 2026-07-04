const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getPrivacySettings,
  hideFromUser,
  unhideFromUser,
} = require("../controllers/privacyController");

router.get("/", protect, getPrivacySettings);
router.post("/hide", protect, hideFromUser);
router.post("/unhide", protect, unhideFromUser);

module.exports = router;