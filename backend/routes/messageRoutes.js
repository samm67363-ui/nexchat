const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getMessages,
  sendMessage,
  reactToMessage,
  searchMessages,
} = require("../controllers/messageController");

router.get("/search", protect, searchMessages);
router.get("/:conversationId", protect, getMessages);
router.post("/", protect, sendMessage);
router.put("/:id/react", protect, reactToMessage);

module.exports = router;