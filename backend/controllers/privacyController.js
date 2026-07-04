const PrivacySettings = require("../models/PrivacySettings");
const User = require("../models/User");

const getPrivacySettings = async (req, res) => {
  try {
    let settings = await PrivacySettings.findOne({ userId: req.user._id })
      .populate("hiddenFrom", "username email avatar");
    if (!settings) settings = { hiddenFrom: [] };
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const hideFromUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId)
      return res.status(400).json({ message: "targetUserId is required" });
    if (targetUserId === req.user._id.toString())
      return res.status(400).json({ message: "Cannot hide from yourself" });
    const targetUser = await User.findById(targetUserId);
    if (!targetUser)
      return res.status(404).json({ message: "User not found" });
    const settings = await PrivacySettings.findOneAndUpdate(
      { userId: req.user._id },
      { $addToSet: { hiddenFrom: targetUserId } },
      { new: true, upsert: true }
    ).populate("hiddenFrom", "username email avatar");
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const unhideFromUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId)
      return res.status(400).json({ message: "targetUserId is required" });
    const settings = await PrivacySettings.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { hiddenFrom: targetUserId } },
      { new: true }
    ).populate("hiddenFrom", "username email avatar");
    res.json(settings || { hiddenFrom: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPrivacySettings, hideFromUser, unhideFromUser };