const express = require("express");
const router = express.Router();
const knex = require("../db/knex");
const authenticateToken = require("../middleware/authenticateToken");

router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (Object.keys(req.query).length > 0) {
    return res.status(400).json({
      error: true,
      message: "Invalid query parameter(s)",
    });
  }

  try {
    const person = await knex("names")
      .select("nconst", "primaryName", "birthYear", "deathYear")
      .where({ nconst: id })
      .first();

    if (!person) {
      return res.status(404).json({ error: true, message: "Person not found" });
    }

    const roles = await knex("principals")
      .leftJoin("basics", "principals.tconst", "basics.tconst")
      .leftJoin("ratings", "principals.tconst", "ratings.tconst")
      .select(
        "principals.tconst as movieId",
        "basics.primaryTitle as movieName",
        "principals.category",
        "ratings.value as imdbRating",
        "principals.characters"
      )
      .where("principals.nconst", id);

    const formattedRoles = roles.map((r) => ({
      movieId: r.movieId,
      movieName: r.movieName,
      category: r.category,
      imdbRating: r.imdbRating ? parseFloat(r.imdbRating) : null,
      characters: r.characters ? JSON.parse(r.characters) : [],
    }));

    return res.status(200).json({
      id: person.nconst,
      name: person.primaryName,
      birthYear: person.birthYear ?? null,
      deathYear: person.deathYear ?? null,
      roles: formattedRoles,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
});

// ⬇️ This should be the last line of the file
module.exports = router;
