// controllers/tokenController.js
const jwt = require("jsonwebtoken");
const knex = require("../db/knex");

exports.refresh = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete, refresh token required",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const bearerToken = jwt.sign(
      { email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: 600 }
    );

    const newRefreshToken = jwt.sign(
      { email: decoded.email },
      process.env.REFRESH_SECRET,
      { expiresIn: 86400 }
    );

    // ✅ Proper response here
    return res.status(200).json({
      bearerToken,
      token_type: "Bearer",
      expires_in: 600,
      refreshToken: newRefreshToken,
      refresh_token_type: "Bearer",
      refresh_expires_in: 86400,
    });
  } catch (err) {
    return res.status(401).json({
      error: true,
      message:
        err.name === "TokenExpiredError"
          ? "JWT token has expired"
          : "Invalid JWT token",
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: true,
        message: "Missing refresh token",
      });
    }

    await knex("tokens").where({ token: refreshToken }).del();

    return res.status(200).json({
      error: false,
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};
