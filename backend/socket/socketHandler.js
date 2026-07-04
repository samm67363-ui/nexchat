const { getAuth } = require("../config/firebase");
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const PrivacySettings = require("../models/PrivacySettings");

// Map: userId -> socketId
const onlineUsers = new Map();

// ── Privacy-aware status broadcast ──────────────────────────────────────────
// Sends online/offline status to every connected user EXCEPT those the
// broadcasting user has hidden themselves from (they always see "offline").
const broadcastStatus = async (io, userId, status, extraData = {}) => {
  try {
    const privacySettings = await PrivacySettings.findOne({ userId });
    const hiddenFrom = privacySettings
      ? privacySettings.hiddenFrom.map((id) => id.toString())
      : [];

    for (const [connectedUserId, socketId] of onlineUsers.entries()) {
      if (connectedUserId === userId.toString()) continue; // skip self

      const effectiveStatus = hiddenFrom.includes(connectedUserId)
        ? "offline"   // hidden → always appears offline
        : status;     // normal → real status

      io.to(socketId).emit("user:status", {
        userId,
        status: effectiveStatus,
        ...extraData,
      });
    }
  } catch (err) {
    // Fallback: broadcast without filtering so chat still works
    console.error("broadcastStatus error:", err.message);
    io.emit("user:status", { userId, status, ...extraData });
  }
};

// ── Main socket handler ──────────────────────────────────────────────────────
const socketHandler = (io) => {

  // ── Auth middleware: verify Firebase token on every connection ──
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("No token"));
      const decoded = await getAuth().verifyIdToken(token);
      const user = await User.findOne({ firebaseUid: decoded.uid });
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Auth failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();

    // Register socket
    onlineUsers.set(userId, socket.id);

    // Mark online in DB
    await User.findByIdAndUpdate(userId, { status: "online" });

    // Broadcast online with privacy filtering
    await broadcastStatus(io, userId, "online");

    console.log(`🟢 Connected: ${socket.user.username} (${socket.id})`);

    // ── Join conversation rooms ──────────────────────────────────
    socket.on("conversations:join", (conversationIds) => {
      conversationIds.forEach((id) => socket.join(id));
    });

    // ── Send message ─────────────────────────────────────────────
    socket.on("message:send", async (data) => {
      try {
        const { conversationId, content, type, replyTo } = data;

        const msg = await Message.create({
          conversationId,
          sender: socket.user._id,
          content,
          type: type || "text",
          replyTo: replyTo || null,
          status: "sent",
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: msg._id,
          lastActivity: new Date(),
        });

        const populated = await msg.populate([
          { path: "sender", select: "username avatar" },
          { path: "replyTo" },
        ]);

        // Broadcast message to everyone in the conversation room
        io.to(conversationId).emit("message:new", populated);

        // Mark delivered for online recipients
        const conv = await Conversation.findById(conversationId);
        conv.participants.forEach(async (pid) => {
          const pidStr = pid.toString();
          if (pidStr !== userId && onlineUsers.has(pidStr)) {
            await Message.findByIdAndUpdate(msg._id, { status: "delivered" });
            io.to(conversationId).emit("message:status", {
              messageId: msg._id,
              status: "delivered",
            });
          }
        });
      } catch (err) {
        console.error("message:send error:", err.message);
        socket.emit("error", { message: err.message });
      }
    });

    // ── Typing indicators ────────────────────────────────────────
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(conversationId).emit("typing:start", {
        userId,
        username: socket.user.username,
        conversationId,
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(conversationId).emit("typing:stop", {
        userId,
        conversationId,
      });
    });

    // ── Mark messages as read ────────────────────────────────────
    socket.on("messages:read", async ({ conversationId }) => {
      await Message.updateMany(
        {
          conversationId,
          sender: { $ne: socket.user._id },
          status: { $ne: "read" },
        },
        { status: "read", $addToSet: { readBy: socket.user._id } }
      );
      io.to(conversationId).emit("messages:read", { conversationId, userId });
    });

    // ── Emoji reactions ──────────────────────────────────────────
    socket.on("message:react", async ({ messageId, emoji }) => {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      const idx = msg.reactions.findIndex((r) => r.emoji === emoji);
      if (idx > -1) {
        const uIdx = msg.reactions[idx].users.map(String).indexOf(userId);
        if (uIdx > -1) {
          msg.reactions[idx].users.splice(uIdx, 1); // toggle off
        } else {
          msg.reactions[idx].users.push(socket.user._id); // toggle on
        }
        if (msg.reactions[idx].users.length === 0) {
          msg.reactions.splice(idx, 1); // remove empty reaction
        }
      } else {
        msg.reactions.push({ emoji, users: [socket.user._id] });
      }

      await msg.save();
      io.to(msg.conversationId.toString()).emit("message:reacted", msg);
    });

    // ── Privacy updated → re-broadcast status immediately ───────
    // Called from frontend after user changes privacy settings
    socket.on("privacy:updated", async () => {
      await broadcastStatus(io, userId, "online");
    });

    // ── Disconnect ───────────────────────────────────────────────
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, {
        status: "offline",
        lastSeen: new Date(),
      });
      await broadcastStatus(io, userId, "offline", { lastSeen: new Date() });
      console.log(`🔴 Disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = socketHandler;