// backend/socket/anonymousSocketHandler.js
const GuestSession = require("../models/GuestSession");
const AnonymousRoom = require("../models/AnonymousRoom");
const AnonymousMessage = require("../models/AnonymousMessage");
const User = require("../models/User");
const { getOnlineSocketId } = require("./socketHandler"); // NEW

module.exports = function anonymousSocketHandler(io) {
  // Separate namespace so this never touches your existing "/" socket auth flow
  const anonNsp = io.of("/anonymous");

  // Helper: notify the host on their MAIN namespace socket (not /anonymous),
  // since the host is usually browsing the regular NexChat UI, not this page.
  const notifyHost = async (roomId, event, payload) => {
    try {
      const room = await AnonymousRoom.findOne({ roomId });
      if (!room) return;
      const hostSocketId = getOnlineSocketId(room.hostUser.toString());
      if (hostSocketId) {
        io.to(hostSocketId).emit(event, { roomId, ...payload });
      }
    } catch (err) {
      console.error(`notifyHost (${event}) error:`, err.message);
    }
  };

  anonNsp.on("connection", (socket) => {
    let currentRoomId = null;
    let currentIdentity = null; // { type: 'host'|'guest', nickname, guestId? }

    // --- Join room ---
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

        // NEW: tell the host (on their main socket) that a guest joined,
        // so the sidebar can show a live "Anonymous · [nickname]" entry.
        if (currentIdentity.type === "guest") {
          await notifyHost(roomId, "anonymous:guest-joined", {
            nickname: currentIdentity.nickname,
          });
        }
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

        // NEW: if a guest sent this, push a live preview update to the host's
        // sidebar even if the host isn't currently on the anonymous chat page.
        if (currentIdentity.type === "guest") {
          await notifyHost(roomId, "anonymous:host-message-update", {
            content: message.content || (message.fileUrl ? "📎 Attachment" : ""),
            fromGuest: true,
          });
        }
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
        // NEW: notify host's main socket BEFORE deleting the room/messages,
        // so notifyHost can still look up room.hostUser.
        await notifyHost(roomId, "anonymous:ended", {
          by: currentIdentity?.nickname || "unknown",
        });

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