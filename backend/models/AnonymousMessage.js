// backend/models/AnonymousMessage.js
const mongoose = require("mongoose");

const anonymousMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  senderType: { type: String, enum: ["user", "guest"], required: true },
  senderNickname: { type: String, required: true }, // host's username OR guest nickname
  content: { type: String, default: "" },
  fileUrl: { type: String, default: null },
  fileType: { type: String, default: null },
  reactions: [{ emoji: String, by: String }], // "by" = nickname, not ObjectId
  delivered: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

module.exports = mongoose.model("AnonymousMessage", anonymousMessageSchema);