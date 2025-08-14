const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;

function formatMessage(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const formattedArgs =
    args.length > 0
      ? " " +
        args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" ")
      : "";

  return `[${timestamp}] ${level.toUpperCase()}: ${message}${formattedArgs}`;
}

function log(level, message, ...args) {
  if (LOG_LEVELS[level] <= currentLevel) {
    console.log(formatMessage(level, message, ...args));
  }
}

const logger = {
  error: (message, ...args) => log("error", message, ...args),
  warn: (message, ...args) => log("warn", message, ...args),
  info: (message, ...args) => log("info", message, ...args),
  debug: (message, ...args) => log("debug", message, ...args),
};

module.exports = logger;
