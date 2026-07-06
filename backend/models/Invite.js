// backend/models/Invite.js
const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true }, // UUID
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roomId: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL auto-delete
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Invite", inviteSchema);