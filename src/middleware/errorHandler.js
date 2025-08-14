const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  let status = 500;
  let message = "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    status = 400;
    message = "Invalid request data";
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid data format";
  } else if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    status = 503;
    message = "External service unavailable";
  } else if (err.response && err.response.status) {
    status = err.response.status;
    message = err.response.data?.message || err.message;
  }

  if (process.env.NODE_ENV === "production" && status === 500) {
    message = "Internal Server Error";
  }

  res.status(status).json({
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
}

module.exports = {
  errorHandler,
};
