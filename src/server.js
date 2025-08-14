const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const citiesRouter = require("./routes/cities");
const { errorHandler } = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/cities", citiesRouter);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
