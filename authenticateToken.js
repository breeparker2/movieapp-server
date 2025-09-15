const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const secret = process.env.JWT_SECRET;

  if (!authHeader) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return res.status(401).json({
      error: true,
      message: "Authorization header is malformed",
    });
  }

  const token = parts[1];

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: true,
        message:
          err.name === "TokenExpiredError"
            ? "JWT token has expired"
            : "Invalid JWT token",
      });
    }

    req.user = decoded;
    next();
  });
};

module.exports = authenticateToken;
