// backend/controllers/anonymousController.js
const { v4: uuidv4 } = require("uuid");
const Invite = require("../models/Invite");
const AnonymousRoom = require("../models/AnonymousRoom");

// POST /api/anonymous/invite  (host only — requires auth middleware upstream)
exports.createInvite = async (req, res) => {
  try {
    const hostUid = req.user.uid; // set by your existing Firebase auth middleware

    const code = uuidv4();
    const roomId = `anon-${uuidv4()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const invite = await Invite.create({
      code,
      createdBy: req.user._id, // your existing Mongo User _id, attached by auth middleware
      roomId,
      expiresAt,
    });

    await AnonymousRoom.create({
      roomId,
      hostUser: req.user._id,
      status: "waiting",
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h backstop, refreshed on activity
    });

    return res.status(201).json({
      inviteCode: invite.code,
      roomId: invite.roomId,
      expiresAt: invite.expiresAt,
      link: `${process.env.CLIENT_URL}/invite/${invite.code}`,
    });

  } catch (err) {
    console.error("createInvite error:", err);
    return res.status(500).json({ message: "Failed to create invite link." });
  }

};
// backend/controllers/anonymousController.js  (add below createInvite)

const GuestSession = require("../models/GuestSession");
const User = require("../models/User"); // for pulling host username/avatar for the invite card

// GET /api/anonymous/invite/:code  (public — validate link, show host preview)
exports.validateInvite = async (req, res) => {
  try {
    const { code } = req.params;

    const invite = await Invite.findOne({ code });
    if (!invite) {
      return res.status(404).json({ message: "This invite link is invalid or has expired." });
    }
    if (invite.used) {
      return res.status(410).json({ message: "This invite link has already been used." });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(410).json({ message: "This invite link has expired." });
    }

    const host = await User.findById(invite.createdBy).select("username avatarUrl");
    if (!host) {
      return res.status(404).json({ message: "Host account no longer exists." });
    }

    return res.status(200).json({
      hostUsername: host.username,
      hostAvatar: host.avatarUrl || null,
      expiresAt: invite.expiresAt,
      roomId: invite.roomId,
    });
  } catch (err) {
    console.error("validateInvite error:", err);
    return res.status(500).json({ message: "Failed to validate invite." });
  }
};

// POST /api/anonymous/invite/:code/join  (public — body: { nickname })
exports.joinInvite = async (req, res) => {
  try {
    const { code } = req.params;
    const { nickname } = req.body;

    if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 20) {
      return res.status(400).json({ message: "Nickname must be 2–20 characters." });
    }

    const invite = await Invite.findOne({ code });
    if (!invite) {
      return res.status(404).json({ message: "This invite link is invalid or has expired." });
    }
    if (invite.used) {
      return res.status(410).json({ message: "This invite link has already been used." });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(410).json({ message: "This invite link has expired." });
    }
    // backend/controllers/anonymousController.js  (add below joinInvite)

const Report = require("../models/Report");

// POST /api/anonymous/room/:roomId/report  (public — guest or host can report)
exports.reportRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { reporterNickname, reason } = req.body;

    if (!reporterNickname) {
      return res.status(400).json({ message: "Missing reporter identity." });
    }

    await Report.create({
      roomId,
      reporterNickname,
      reason: reason?.slice(0, 300) || "unspecified",
    });

    return res.status(201).json({ message: "Report submitted. Our team will review this conversation." });
  } catch (err) {
    console.error("reportRoom error:", err);
    return res.status(500).json({ message: "Failed to submit report." });
  }
};

    // Prevent duplicate joins / race condition: atomically mark used
    const claimed = await Invite.findOneAndUpdate(
      { code, used: false },
      { used: true },
      { new: true }
    );
    if (!claimed) {
      return res.status(410).json({ message: "This invite link was just used by someone else." });
    }

    const room = await AnonymousRoom.findOne({ roomId: invite.roomId });
    if (!room) {
      return res.status(404).json({ message: "Room no longer exists." });
    }

    const guestId = require("uuid").v4();
    const guestExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const guestSession = await GuestSession.create({
      guestId,
      nickname: nickname.trim(),
      roomId: room.roomId,
      expiresAt: guestExpiresAt,
    });

    room.guestNickname = nickname.trim();
    room.status = "active";
    room.lastActivityAt = new Date();
    await room.save();

    return res.status(200).json({
      guestId: guestSession.guestId,
      nickname: guestSession.nickname,
      roomId: room.roomId,
    });
  } catch (err) {
    console.error("joinInvite error:", err);
    return res.status(500).json({ message: "Failed to join chat." });
  }
};