const knex = require("../db/knex");

exports.searchMovies = async (req, res) => {
  try {
    const query = (req.query.query || req.query.title)?.toLowerCase();
    const year = req.query.year;
    const rawPage = req.query.page;
    const page = rawPage === undefined ? 1 : parseInt(rawPage);
    const perPage = 100;

    if (year && (!/^\d{4}$/.test(year) || isNaN(parseInt(year)))) {
      return res.status(400).json({
        error: true,
        message: "Invalid year format. Format must be yyyy.",
      });
    }

    if (rawPage !== undefined && (isNaN(page) || page <= 0)) {
      return res.status(400).json({
        error: true,
        message: "Invalid page format. page must be a number.",
      });
    }

    let moviesQuery = knex("basics").select(
      "primaryTitle as title",
      "year",
      "tconst as imdbID",
      "imdbRating",
      "rottentomatoesRating as rottenTomatoesRating",
      "metacriticRating",
      "rated as classification"
    );

    if (query) {
      moviesQuery = moviesQuery.whereRaw("LOWER(primaryTitle) LIKE ?", [
        `%${query}%`,
      ]);
    }

    if (year) {
      moviesQuery = moviesQuery.andWhere("year", parseInt(year));
    }

    const totalQuery = moviesQuery.clone();
    const total = (await totalQuery).length;
    const offset = (page - 1) * perPage;
    const lastPage = Math.ceil(total / perPage);
    const from = total === 0 ? 0 : offset;

    const paginatedResultsRaw = await moviesQuery
      .clone()
      .limit(perPage)
      .offset(offset);

    const paginatedResults = paginatedResultsRaw.map((movie) => ({
      ...movie,
      imdbRating: movie.imdbRating !== null ? Number(movie.imdbRating) : null,
      rottenTomatoesRating:
        movie.rottenTomatoesRating !== null
          ? Number(movie.rottenTomatoesRating)
          : null,
      metacriticRating:
        movie.metacriticRating !== null ? Number(movie.metacriticRating) : null,
      classification: movie.classification || "N/A",
    }));

    const to = total === 0 ? 0 : from + paginatedResults.length;

    return res.status(200).json({
      data: paginatedResults,
      pagination: {
        total,
        perPage,
        currentPage: page,
        lastPage,
        from,
        to,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < lastPage ? page + 1 : null,
      },
    });
  } catch (err) {
    console.error(" Movie search failed:", err);
    return res
      .status(500)
      .json({ error: true, message: "Failed to fetch movies" });
  }
};

exports.getMovieData = async (req, res) => {
  const { imdbID } = req.params;

  //  Validate imdbID format
  if (!imdbID || typeof imdbID !== "string" || !/^tt\d{7,8}$/.test(imdbID)) {
    return res.status(400).json({
      error: true,
      message: "Invalid imdbID format",
    });
  }

  //  Reject unknown query parameters
  const allowedQueryParams = new Set(); // No params expected
  const unknownParams = Object.keys(req.query).filter(
    (key) => !allowedQueryParams.has(key)
  );

  if (unknownParams.length > 0) {
    return res.status(400).json({
      error: true,
      message: "Query parameters are not permitted.",
    });
  }

  try {
    const basic = await knex("basics").where({ tconst: imdbID }).first();
    if (!basic) {
      return res.status(404).json({
        error: true,
        message: "Movie not found",
      });
    }

    const cast = await knex("principals")
      .leftJoin("names", "principals.nconst", "names.nconst")
      .where("principals.tconst", imdbID)
      .select(
        "principals.nconst",
        "principals.category",
        "names.primaryName as name",
        "principals.characters"
      );

    const principals = cast.map((person) => ({
      id: person.nconst,
      category: person.category,
      name: person.name || null,
      characters: Array.isArray(person.characters)
        ? person.characters
        : person.characters
        ? JSON.parse(person.characters.replace(/'/g, '"'))
        : [],
    }));

    const ratings = [];
    if (basic.imdbRating != null) {
      ratings.push({
        source: "Internet Movie Database",
        value: Number(basic.imdbRating),
      });
    }
    if (basic.rottentomatoesRating != null) {
      ratings.push({
        source: "Rotten Tomatoes",
        value: Number(basic.rottentomatoesRating),
      });
    }
    if (basic.metacriticRating != null) {
      ratings.push({
        source: "Metacritic",
        value: Number(basic.metacriticRating),
      });
    }

    return res.status(200).json({
      title: basic.primaryTitle || null,
      year: basic.year || null,
      runtime: basic.runtimeMinutes || null,
      genres: basic.genres ? basic.genres.split(",") : [],
      boxoffice: basic.boxoffice || null,
      plot: basic.plot || null,
      poster: basic.poster || null,
      ratings,
      principals,
      characters: principals.flatMap((p) => p.characters) || [],
    });
  } catch (err) {
    console.error(" Error in getMovieData:", err);
    return res.status(500).json({
      error: true,
      message: err.message || "Internal server error",
    });
  }
};
