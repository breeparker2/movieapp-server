const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");

// ✅ Fallback for missing imdbID param
router.get("/data", (req, res) => {
  return res.status(400).json({
    error: true,
    message: "Invalid imdbID format",
  });
});

// GET /movies/search?query=batman
router.get("/search", movieController.searchMovies);

// GET /movies/data/:imdbID
router.get("/data/:imdbID", movieController.getMovieData);

module.exports = router;
