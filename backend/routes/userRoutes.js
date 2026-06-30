const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  registerUser,
  getMe,
  updateProfile,
  searchUsers,
  getUserById,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.get("/search", protect, searchUsers);
router.get("/:id", protect, getUserById);

module.exports = router;