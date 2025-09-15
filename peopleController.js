const knex = require("../db/knex");

exports.getPerson = async (req, res) => {
  if (Object.keys(req.query).length > 0) {
    return res.status(400).json({
      error: true,
      message: "Invalid query parameter(s)",
    });
  }

  const { id } = req.params;

  try {
    const person = await knex("names").where({ nconst: id }).first();

    if (!person) {
      return res.status(404).json({
        error: true,
        message: "Person not found",
      });
    }

    const roles = await knex("principals")
      .leftJoin("basics", "principals.tconst", "basics.tconst")
      .leftJoin("ratings", function () {
        this.on("principals.tconst", "=", "ratings.tconst").andOn(
          "ratings.source",
          knex.raw("?", ["Internet Movie Database"])
        );
      })
      .where("principals.nconst", id)
      .select(
        "principals.tconst as movieId",
        "basics.primaryTitle as movieName",
        "principals.category",
        "ratings.value as imdbRating",
        "principals.characters"
      );

    return res.status(200).json({
      id: person.nconst,
      name: person.primaryName,
      birthYear: person.birthYear ?? null,
      deathYear: person.deathYear ?? null,
      roles: roles.map((role) => ({
        movieId: role.movieId,
        movieName: role.movieName,
        category: role.category,
        imdbRating: role.imdbRating ?? null,
        characters: (() => {
          try {
            return role.characters ? JSON.parse(role.characters) : [];
          } catch {
            return [];
          }
        })(),
      })),
    });
  } catch (err) {
    console.error("getPerson error:", err);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};
