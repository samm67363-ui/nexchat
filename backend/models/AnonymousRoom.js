// backend/models/AnonymousRoom.js
const mongoose = require("mongoose");

const anonymousRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  hostUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  guestNickname: { type: String, default: null },
  status: { type: String, enum: ["waiting", "active", "ended"], default: "waiting" },
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // 24h after last activity
});

module.exports = mongoose.model("AnonymousRoom", anonymousRoomSchema);