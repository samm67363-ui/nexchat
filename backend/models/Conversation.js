const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["direct", "group"], default: "direct" },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    groupName: { type: String, default: "" },
    groupAvatar: { type: String, default: "" },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    lastActivity: { type: Date, default: Date.now },
    unreadCount: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);