const { v4: uuidv4 } = require("uuid");
const Invite = require("../models/Invite");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

// POST /api/invites/generate
// Creates a new invite link valid for 10 minutes
const generateInvite = async (req, res) => {
  try {
    const inviteCode = uuidv4();
    const roomId = uuidv4(); // unique room for this chat session
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const invite = await Invite.create({
      inviteCode,
      createdBy: req.user._id,
      roomId,
      expiresAt,
    });

    // Build the full invite link
    const inviteLink = `${process.env.CLIENT_URL}/invite/${inviteCode}`;

    res.status(201).json({
      inviteCode,
      inviteLink,
      roomId,
      expiresAt,
    });
  } catch (err) {
    console.error("generateInvite error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invites/:code
// Validate an invite link before joining
const validateInvite = async (req, res) => {
  try {
    const { code } = req.params;

    const invite = await Invite.findOne({ inviteCode: code }).populate(
      "createdBy",
      "username avatar"
    );

    if (!invite) {
      return res.status(404).json({ message: "Invite link is invalid or has expired" });
    }

    if (invite.used) {
      return res.status(400).json({ message: "This invite link has already been used" });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ message: "This invite link has expired" });
    }

    // Don't allow creator to join their own invite
    if (invite.createdBy._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot join your own invite link" });
    }

    res.json({
      inviteCode: invite.inviteCode,
      roomId: invite.roomId,
      createdBy: invite.createdBy,
      expiresAt: invite.expiresAt,
    });
  } catch (err) {
    console.error("validateInvite error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invites/:code/join
// Mark invite as used and create a conversation between both users
const joinInvite = async (req, res) => {
  try {
    const { code } = req.params;

    const invite = await Invite.findOne({ inviteCode: code });

    if (!invite) {
      return res.status(404).json({ message: "Invite link is invalid or has expired" });
    }

    if (invite.used) {
      return res.status(400).json({ message: "This invite link has already been used" });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ message: "This invite link has expired" });
    }

    if (invite.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot join your own invite link" });
    }

    // Mark invite as used
    invite.used = true;
    invite.usedBy = req.user._id;
    await invite.save();

    // Create or get existing conversation between the two users
    let conversation = await Conversation.findOne({
      type: "direct",
      participants: { $all: [invite.createdBy, req.user._id], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [invite.createdBy, req.user._id],
      });
    }

    const populated = await conversation.populate(
      "participants",
      "username avatar status"
    );

    res.json({
      conversation: populated,
      roomId: invite.roomId,
      createdBy: invite.createdBy,
    });
  } catch (err) {
    console.error("joinInvite error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { generateInvite, validateInvite, joinInvite };