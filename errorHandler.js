module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err); // Let Express handle it if headers already sent
  }

  console.error("[ERROR]", err.stack || err);

  const status = typeof err.status === "number" ? err.status : 500;
  const message =
    typeof err.message === "string" ? err.message : "Internal Server Error";

  res.status(status).json({
    error: true,
    message,
  });
};
