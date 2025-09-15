const knex = require("../db/knex");

exports.getProfile = async (req, res) => {
  const { email } = req.params;

  if (Object.keys(req.query).length > 0) {
    return res.status(400).json({
      error: true,
      message: "Invalid query parameter(s)",
    });
  }

  try {
    const user = await knex("users").where({ email }).first();

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    const isOwner = req.user && req.user.email === email;

    if (isOwner) {
      //  Use explicit nulls to pass tests
      return res.status(200).json({
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        dob: user.dob ?? null,
        address: user.address ?? null,
      });
    } else {
      //  Still include email in partial profile
      return res.status(200).json({
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
      });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
};

exports.updateUserProfile = async (req, res) => {
  const { email } = req.params;
  const tokenUserEmail = req.user?.email;

  if (!tokenUserEmail) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  }

  if (tokenUserEmail !== email) {
    return res.status(403).json({
      error: true,
      message: "Forbidden",
    });
  }

  let { firstName, lastName, dob, address } = req.body;

  // Validate string types if provided
  if (
    (firstName && typeof firstName !== "string") ||
    (lastName && typeof lastName !== "string") ||
    (address && typeof address !== "string")
  ) {
    return res.status(400).json({
      error: true,
      message:
        "Request body invalid: firstName, lastName and address must be strings only.",
    });
  }

  // Validate DOB format if provided
  if (dob) {
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dob) || isNaN(new Date(dob).getTime())) {
      return res.status(400).json({
        error: true,
        message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
      });
    }
  }

  // Normalize null values
  const updatedFields = {
    firstName: firstName || null,
    lastName: lastName || null,
    dob: dob || null,
    address: address || null,
  };

  try {
    const user = await knex("users").where({ email }).first();

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    await knex("users").where({ email }).update(updatedFields);

    return res.status(200).json({
      email,
      ...updatedFields,
    });
  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};
