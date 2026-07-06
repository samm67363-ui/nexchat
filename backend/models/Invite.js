// backend/models/Invite.js
const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roomId: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  createdAt: { type: Date, default: Date.now },
}, { collection: "anonymousInvites" }); // ← force a separate collection, avoids clashing with legacy "invites"

module.exports = mongoose.model("AnonymousInvite", inviteSchema); // ← also rename the model itself to avoid any Mongoose model-name collisions