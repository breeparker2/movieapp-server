const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const knex = require("../db/knex");

exports.register = async (req, res) => {
  const { email, password, firstName, lastName, dob, address } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "Email and password required" });
  }

  try {
    const existingUser = await knex("users").where({ email }).first();
    if (existingUser) {
      return res
        .status(409)
        .json({ error: true, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await knex("users").insert({
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      dob: dob || null,
      address: address || null,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: true, message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  const { email, password, bearerExpiresInSeconds, refreshExpiresInSeconds } =
    req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "Email and password required" });
  }

  try {
    console.log(" Attempting login for:", email);

    const user = await knex("users").where({ email }).first();

    if (!user) {
      console.log("❌ No user found for:", email);
      return res
        .status(401)
        .json({ error: true, message: "Incorrect email or password" });
    }

    console.log(" JWT_SECRET =", process.env.JWT_SECRET);
    console.log(" Attempting login for:", email);
    console.log(" Password hash in DB:", user.password);
    console.log(" Password provided:", password);

    const match = await bcrypt.compare(password, user.password);
    console.log(" Password match result:", match);

    console.log("🔄 Password match result:", match);

    if (!match) {
      console.log("❌ Password mismatch.");
      return res
        .status(401)
        .json({ error: true, message: "Incorrect email or password" });
    }

    const bearerExpiry = bearerExpiresInSeconds || 600;
    const refreshExpiry = refreshExpiresInSeconds || 86400;

    const bearerToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: bearerExpiry,
    });

    const refreshToken = jwt.sign({ email }, process.env.REFRESH_SECRET, {
      expiresIn: refreshExpiry,
    });

    //  Final confirmation
    console.log(" Login successful for:", email);

    res.status(200).json({
      bearerToken,
      token_type: "Bearer",
      expires_in: bearerExpiry,
      refreshToken,
      refresh_token_type: "Bearer",
      refresh_expires_in: refreshExpiry,
    });
  } catch (err) {
    console.error(" Login error:", err);
    res.status(500).json({ error: true, message: "Login failed" });
  }
};

exports.logout = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete, refresh token required",
    });
  }

  try {
    jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    return res.status(200).json({
      error: false,
      message: "Token successfully invalidated",
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: true,
        message: "JWT token has expired",
      });
    }

    return res.status(401).json({
      error: true,
      message: "Invalid JWT token",
    });
  }
};

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

    const newBearerToken = jwt.sign(
      { email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: 600 }
    );

    return res.status(200).json({
      bearerToken: newBearerToken,
      token_type: "Bearer",
      expires_in: 600,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: true,
        message: "JWT token has expired",
      });
    }

    return res.status(401).json({
      error: true,
      message: "Invalid JWT token",
    });
  }
};
