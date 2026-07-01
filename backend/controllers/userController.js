const User = require("../models/User");

// POST /api/users/register — called after Firebase signup
const registerUser = async (req, res) => {
  const { firebaseUid, username, email, avatar } = req.body;
  try {
    let user = await User.findOne({ firebaseUid });
    if (user) return res.status(200).json(user);

    user = await User.create({ firebaseUid, username, email, avatar });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, bio, avatar },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/search?q=name
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: req.user._id },
    }).select("-firebaseUid");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-firebaseUid");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerUser, getMe, updateProfile, searchUsers, getUserById };