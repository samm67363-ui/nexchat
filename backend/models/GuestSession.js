// backend/models/GuestSession.js
const mongoose = require("mongoose");

const guestSessionSchema = new mongoose.Schema({
  guestId: { type: String, required: true, unique: true, index: true }, // uuid, not ObjectId ref
  nickname: { type: String, required: true },
  roomId: { type: String, required: true, index: true },
  socketId: { type: String, default: null },
  joinedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

module.exports = mongoose.model("GuestSession", guestSessionSchema);