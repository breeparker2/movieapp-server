const express = require("express");
const router = express.Router();
const tokenController = require("../controllers/tokenController");

router.post("/refresh", tokenController.refresh);
router.post("/logout", tokenController.logout);

module.exports = router;
