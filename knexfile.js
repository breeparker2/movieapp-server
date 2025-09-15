require("dotenv").config();

module.exports = {
  client: "mysql2",
  connection: {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "Cab230!",
    database: "movies",
  },
};
