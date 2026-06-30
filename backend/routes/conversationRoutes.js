const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getConversations,
  createOrGetConversation,
  createGroupConversation,
} = require("../controllers/conversationController");

router.get("/", protect, getConversations);
router.post("/", protect, createOrGetConversation);
router.post("/group", protect, createGroupConversation);

module.exports = router;