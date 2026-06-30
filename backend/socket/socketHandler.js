const { getAuth } = require("../config/firebase");
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// Map: userId -> socketId
const onlineUsers = new Map();

const socketHandler = (io) => {
  // Middleware: verify Firebase token on connect
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
    onlineUsers.set(userId, socket.id);

    // Update user status to online
    await User.findByIdAndUpdate(userId, { status: "online" });
    io.emit("user:status", { userId, status: "online" });

    console.log(`🟢 User connected: ${socket.user.username} (${socket.id})`);

    // Join all conversation rooms
    socket.on("conversations:join", (conversationIds) => {
      conversationIds.forEach((id) => socket.join(id));
    });

    // Real-time message send
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

        // Emit to everyone in the room
        io.to(conversationId).emit("message:new", populated);

        // Update status to delivered for online recipients
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
        socket.emit("error", { message: err.message });
      }
    });

    // Typing indicators
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(conversationId).emit("typing:start", {
        userId,
        username: socket.user.username,
        conversationId,
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(conversationId).emit("typing:stop", { userId, conversationId });
    });

    // Mark messages as read
    socket.on("messages:read", async ({ conversationId }) => {
      await Message.updateMany(
        { conversationId, sender: { $ne: socket.user._id }, status: { $ne: "read" } },
        { status: "read", $addToSet: { readBy: socket.user._id } }
      );
      io.to(conversationId).emit("messages:read", { conversationId, userId });
    });

    // Emoji reaction via socket
    socket.on("message:react", async ({ messageId, emoji }) => {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      const idx = msg.reactions.findIndex((r) => r.emoji === emoji);
      if (idx > -1) {
        const uIdx = msg.reactions[idx].users.map(String).indexOf(userId);
        if (uIdx > -1) msg.reactions[idx].users.splice(uIdx, 1);
        else msg.reactions[idx].users.push(socket.user._id);
        if (msg.reactions[idx].users.length === 0) msg.reactions.splice(idx, 1);
      } else {
        msg.reactions.push({ emoji, users: [socket.user._id] });
      }
      await msg.save();
      io.to(msg.conversationId.toString()).emit("message:reacted", msg);
    });

    // Disconnect
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { status: "offline", lastSeen: new Date() });
      io.emit("user:status", { userId, status: "offline", lastSeen: new Date() });
      console.log(`🔴 User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = socketHandler;