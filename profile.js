const express = require("express");
const router = express.Router();
const controller = require("../controllers/profileController");
const optionalAuth = require("../middleware/optionalAuth");
const authenticateToken = require("../middleware/authenticateToken");

// ✅ GET /user/:email/profile — get profile (private/public)
router.get("/:email/profile", optionalAuth, controller.getProfile);

// ✅ PUT /user/:email/profile — update own profile
router.put("/:email/profile", authenticateToken, controller.updateUserProfile);

module.exports = router;
