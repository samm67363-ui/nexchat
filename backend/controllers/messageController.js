const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// GET /api/messages/:conversationId
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      conversationId,
      deletedFor: { $nin: [req.user._id] },
    })
      .populate("sender", "username avatar")
      .populate("replyTo")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type, replyTo } = req.body;

    const msg = await Message.create({
      conversationId,
      sender: req.user._id,
      content,
      type: type || "text",
      replyTo: replyTo || null,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: msg._id,
      lastActivity: new Date(),
    });

    const populated = await msg.populate("sender", "username avatar");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/messages/:id/react
const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    const reactionIdx = msg.reactions.findIndex((r) => r.emoji === emoji);
    if (reactionIdx > -1) {
      const userIdx = msg.reactions[reactionIdx].users.indexOf(req.user._id.toString());
      if (userIdx > -1) {
        msg.reactions[reactionIdx].users.splice(userIdx, 1);
        if (msg.reactions[reactionIdx].users.length === 0) {
          msg.reactions.splice(reactionIdx, 1);
        }
      } else {
        msg.reactions[reactionIdx].users.push(req.user._id);
      }
    } else {
      msg.reactions.push({ emoji, users: [req.user._id] });
    }

    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/search?q=text&conversationId=id
const searchMessages = async (req, res) => {
  try {
    const { q, conversationId } = req.query;
    const filter = {
      content: { $regex: q, $options: "i" },
      deletedFor: { $nin: [req.user._id] },
    };
    if (conversationId) filter.conversationId = conversationId;

    const messages = await Message.find(filter)
      .populate("sender", "username avatar")
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMessages, sendMessage, reactToMessage, searchMessages };