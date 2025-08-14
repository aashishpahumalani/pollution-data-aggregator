const axios = require("axios");
const retry = require("async-retry");
const logger = require("../utils/logger");
const cache = require("../utils/cache");

const WIKIPEDIA_API_BASE_URL = process.env.WIKIPEDIA_API_BASE_URL;

async function getCityDescription(cityName, country = "Unknown") {
  try {
    // Use retry logic to handle rate limiting and transient errors
    const description = await retry(
      async (bail) => {
        try {
          const response = await axios.get(
            `${WIKIPEDIA_API_BASE_URL}/page/summary/${encodeURIComponent(
              cityName
            )}`,
            {
              timeout: 8000,
              headers: {
                "User-Agent":
                  "PollutionDataAggregator/1.0 (https://github.com/example/pollution-data-aggregator)",
              },
            }
          );

          let description = response.data.extract || response.data.description;
          if (description) {
            description = description
              .replace(/\[\d+\]/g, "")
              .replace(/\s+/g, " ")
              .trim();

            if (description.length > 200) {
              description = description.substring(0, 200).trim() + "...";
            }
          }
          return description;
        } catch (error) {
          if (error.response) {
            const status = error.response.status;

            // Rate limiting errors - retry with backoff
            if (status === 429) {
              throw error;
            }

            if (status >= 400 && status < 500 && status !== 429) {
              bail(error); // Don't retry client errors except rate limits
              return;
            }

            if (status >= 500) {
              throw error;
            }
          }

          if (
            error.code === "ECONNRESET" ||
            error.code === "ETIMEDOUT" ||
            error.code === "ENOTFOUND"
          ) {
            throw error;
          }
          bail(error);
        }
      },
      {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 10000,
        randomize: true,
        onRetry: (error, attemptNumber) => {
          logger.info(
            `Retry attempt ${attemptNumber} for ${cityName} due to: ${error.message}`
          );
        },
      }
    );
    return description;
  } catch (error) {
    // Cache this city as invalid for this country if it's a client error
    if (
      error.response &&
      error.response.status >= 400 &&
      error.response.status < 500
    ) {
      logger.error(
        `Added ${cityName} to invalid cities list for ${country} after final catch`
      );
    }
    return null;
  }
}

module.exports = {
  getCityDescription,
};
