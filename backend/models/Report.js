// backend/models/Report.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  reporterNickname: { type: String, required: true },
  reason: { type: String, default: "unspecified" },
  createdAt: { type: Date, default: Date.now },
  // Not TTL'd — reports should persist for moderation review even after the room is gone
});

module.exports = mongoose.model("Report", reportSchema);