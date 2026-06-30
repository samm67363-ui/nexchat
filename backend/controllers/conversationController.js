const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// GET /api/conversations — all conversations for current user
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username avatar status lastSeen")
      .populate("lastMessage")
      .sort({ lastActivity: -1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/conversations — start or get direct conversation
const createOrGetConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    let conv = await Conversation.findOne({
      type: "direct",
      participants: { $all: [req.user._id, recipientId], $size: 2 },
    })
      .populate("participants", "username avatar status lastSeen")
      .populate("lastMessage");

    if (!conv) {
      conv = await Conversation.create({
        type: "direct",
        participants: [req.user._id, recipientId],
      });
      conv = await conv.populate("participants", "username avatar status lastSeen");
    }
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/conversations/group
const createGroupConversation = async (req, res) => {
  try {
    const { groupName, participantIds } = req.body;
    const all = [req.user._id, ...participantIds];
    const conv = await Conversation.create({
      type: "group",
      groupName,
      participants: all,
      groupAdmin: req.user._id,
    });
    const populated = await conv.populate("participants", "username avatar status");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getConversations, createOrGetConversation, createGroupConversation };