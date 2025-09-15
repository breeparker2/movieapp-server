require("dotenv").config();

const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const tokenRoutes = require("./routes/token.js");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

//  Load Swagger JSON first
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "docs", "openapi.json"), "utf8")
);

//  Import routes and middleware
const userRoutes = require("./routes/user.js");
const movieRoutes = require("./routes/movies.js");
const profileRoutes = require("./routes/profile.js");
const peopleRoutes = require("./routes/people.js");
const errorHandler = require("./middleware/errorHandler.js");

//  Middleware
app.use(helmet());
app.use(cors());

//  API routes
app.use("/user", userRoutes);
app.use("/movies", movieRoutes);
app.use("/profile", profileRoutes);
app.use("/people", peopleRoutes);
app.use("/token", tokenRoutes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: "Route not found",
  });
});

app.use(errorHandler);

//  Start HTTP for Gradescope OR HTTPS for local dev
const isGradescope = false;
console.log("Is Gradescope:", isGradescope);

if (isGradescope) {
  app.listen(PORT, () => {
    console.log(` HTTP server running at https://localhost:${PORT}`);
  });
} else {
  const options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
  };

  https.createServer(options, app).listen(PORT, () => {
    console.log(` HTTPS server running at https://localhost:${PORT}`);
  });
}
