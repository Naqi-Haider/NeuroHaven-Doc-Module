const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${err.name || "Error"}:`, err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      status: statusCode,
    },
  });
};

module.exports = {
  errorHandler,
};
