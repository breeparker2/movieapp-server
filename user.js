// In routes/user.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const profileController = require("../controllers/profileController");
const auth = require("../middleware/authenticateToken");
const optionalAuth = require("../middleware/optionalAuth");

console.log(
  "updateUserProfile exists?",
  typeof profileController.updateUserProfile
);

// User routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.post("/refresh", userController.refresh);

// Profile routes under /user/
router.put("/:email/profile", auth, profileController.updateUserProfile);
router.get("/:email/profile", optionalAuth, profileController.getProfile);

module.exports = router;
