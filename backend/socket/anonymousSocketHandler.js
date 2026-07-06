// backend/socket/anonymousSocketHandler.js
const GuestSession = require("../models/GuestSession");
const AnonymousRoom = require("../models/AnonymousRoom");
const AnonymousMessage = require("../models/AnonymousMessage");
const User = require("../models/User");

module.exports = function anonymousSocketHandler(io) {
  // Separate namespace so this never touches your existing "/" socket auth flow
  const anonNsp = io.of("/anonymous");

  anonNsp.on("connection", (socket) => {
    let currentRoomId = null;
    let currentIdentity = null; // { type: 'host'|'guest', nickname, guestId? }

    // --- Join room ---
    // Host joins with their Firebase-verified identity (passed from client after normal login)
    // Guest joins with { guestId } issued by the /join REST call in Step 3
    socket.on("anonymous:join", async ({ roomId, guestId, hostUid }) => {
      try {
        const room = await AnonymousRoom.findOne({ roomId });
        if (!room || room.status === "ended") {
          return socket.emit("anonymous:error", { message: "Room is no longer active." });
        }

        if (guestId) {
          const session = await GuestSession.findOne({ guestId, roomId });
          if (!session) {
            return socket.emit("anonymous:error", { message: "Guest session not found or expired." });
          }
          session.socketId = socket.id;
          await session.save();
          currentIdentity = { type: "guest", nickname: session.nickname, guestId };
        } else if (hostUid) {
          const host = await User.findOne({ firebaseUid: hostUid });
          if (!host || String(host._id) !== String(room.hostUser)) {
            return socket.emit("anonymous:error", { message: "Not authorized for this room." });
          }
          currentIdentity = { type: "host", nickname: host.username };
        } else {
          return socket.emit("anonymous:error", { message: "Missing identity." });
        }

        currentRoomId = `anonymous:${roomId}`;
        socket.join(currentRoomId);

        room.lastActivityAt = new Date();
        await room.save();

        anonNsp.to(currentRoomId).emit("anonymous:presence", {
          nickname: currentIdentity.nickname,
          status: "online",
        });
      } catch (err) {
        console.error("anonymous:join error:", err);
        socket.emit("anonymous:error", { message: "Failed to join room." });
      }
    });

    // --- Typing indicator ---
    socket.on("anonymous:typing", ({ isTyping }) => {
      if (!currentRoomId || !currentIdentity) return;
      socket.to(currentRoomId).emit("anonymous:typing", {
        nickname: currentIdentity.nickname,
        isTyping,
      });
    });

    // --- Send message ---
    socket.on("anonymous:message", async ({ roomId, content, fileUrl, fileType }) => {
      try {
        if (!currentIdentity || !currentRoomId) {
          return socket.emit("anonymous:error", { message: "Not joined to a room." });
        }

        const message = await AnonymousMessage.create({
          roomId,
          senderType: currentIdentity.type === "host" ? "user" : "guest",
          senderNickname: currentIdentity.nickname,
          content: content || "",
          fileUrl: fileUrl || null,
          fileType: fileType || null,
          delivered: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        await AnonymousRoom.findOneAndUpdate({ roomId }, { lastActivityAt: new Date() });

        anonNsp.to(currentRoomId).emit("anonymous:message", {
          _id: message._id,
          senderType: message.senderType,
          senderNickname: message.senderNickname,
          content: message.content,
          fileUrl: message.fileUrl,
          fileType: message.fileType,
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error("anonymous:message error:", err);
        socket.emit("anonymous:error", { message: "Failed to send message." });
      }
    });

    // --- Read receipt ---
    socket.on("anonymous:read", async ({ messageId }) => {
      try {
        await AnonymousMessage.findByIdAndUpdate(messageId, { read: true });
        if (currentRoomId) {
          socket.to(currentRoomId).emit("anonymous:read", { messageId });
        }
      } catch (err) {
        console.error("anonymous:read error:", err);
      }
    });

    // --- Reactions ---
    socket.on("anonymous:react", async ({ messageId, emoji }) => {
      try {
        if (!currentIdentity) return;
        const msg = await AnonymousMessage.findByIdAndUpdate(
          messageId,
          { $push: { reactions: { emoji, by: currentIdentity.nickname } } },
          { new: true }
        );
        if (currentRoomId && msg) {
          anonNsp.to(currentRoomId).emit("anonymous:react", {
            messageId,
            emoji,
            by: currentIdentity.nickname,
          });
        }
      } catch (err) {
        console.error("anonymous:react error:", err);
      }
    });

    // --- End chat (either side) ---
    socket.on("anonymous:end", async ({ roomId }) => {
      try {
        await AnonymousRoom.findOneAndUpdate({ roomId }, { status: "ended" });
        await AnonymousMessage.deleteMany({ roomId });
        await GuestSession.deleteMany({ roomId });

        anonNsp.to(`anonymous:${roomId}`).emit("anonymous:ended", {
          by: currentIdentity?.nickname || "unknown",
        });

        const sockets = await anonNsp.in(`anonymous:${roomId}`).fetchSockets();
        sockets.forEach((s) => s.leave(`anonymous:${roomId}`));
      } catch (err) {
        console.error("anonymous:end error:", err);
      }
    });

    // --- Disconnect ---
    socket.on("disconnect", () => {
      if (currentRoomId && currentIdentity) {
        socket.to(currentRoomId).emit("anonymous:presence", {
          nickname: currentIdentity.nickname,
          status: "offline",
        });
      }
    });
  });
};