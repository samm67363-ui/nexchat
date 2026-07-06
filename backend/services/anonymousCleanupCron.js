// backend/services/anonymousCleanupCron.js
const cron = require("node-cron");
const AnonymousRoom = require("../models/AnonymousRoom");
const AnonymousMessage = require("../models/AnonymousMessage");
const GuestSession = require("../models/GuestSession");
const Invite = require("../models/Invite");

function startAnonymousCleanupCron() {
  // Runs every 5 minutes — catches rooms abandoned without a proper "End Chat" click
  cron.schedule("*/5 * * * *", async () => {
    try {
      const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h inactivity

      const staleRooms = await AnonymousRoom.find({
        status: { $ne: "ended" },
        lastActivityAt: { $lt: staleThreshold },
      });

      for (const room of staleRooms) {
        await AnonymousMessage.deleteMany({ roomId: room.roomId });
        await GuestSession.deleteMany({ roomId: room.roomId });
        await Invite.deleteMany({ roomId: room.roomId });
        room.status = "ended";
        await room.save();
      }

      if (staleRooms.length > 0) {
        console.log(`[anonymous-cleanup] Cleaned up ${staleRooms.length} stale room(s).`);
      }

      // Also delete rooms that finished "ended" a while ago (housekeeping)
      await AnonymousRoom.deleteMany({
        status: "ended",
        lastActivityAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
    } catch (err) {
      console.error("[anonymous-cleanup] error:", err);
    }
  });

  console.log("[anonymous-cleanup] Cron scheduled (every 5 min).");
}

module.exports = startAnonymousCleanupCron;