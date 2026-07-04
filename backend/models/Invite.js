const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    // Unique invite code (UUID)
    inviteCode: {
      type: String,
      required: true,
      unique: true,
    },
    // User who created the invite link
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The conversation room ID both users will join
    roomId: {
      type: String,
      required: true,
    },
    // Expires after 10 minutes
    expiresAt: {
      type: Date,
      required: true,
    },
    // Whether the invite has been used
    used: {
      type: Boolean,
      default: false,
    },
    // Who joined using this invite
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-expire: MongoDB TTL index removes document after expiresAt
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Invite", inviteSchema);