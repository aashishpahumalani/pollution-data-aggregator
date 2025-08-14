const axios = require("axios");
const retry = require("async-retry");
const logger = require("../utils/logger");
const authService = require("./authService");
const API_BASE_URL = process.env.API_BASE_URL;

async function fetchPollutionData(options) {
  const { country, page, limit } = options;

  try {
    const data = await retry(
      async (bail, attemptNumber) => {
        try {
          const accessToken = await authService.getValidAccessToken();

          const params = new URLSearchParams({
            country: country,
            page: page.toString(),
            limit: limit.toString(),
          });
          const url = `${API_BASE_URL}/pollution?${params.toString()}`;

          const response = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            timeout: 15000, // 15 second timeout
          });

          return response.data.results;
        } catch (error) {
          if (error.response) {
            const status = error.response.status;
            if (status === 429) {
              logger.warn(`API rate limited, attempt ${attemptNumber}`);
              throw error;
            }

            // Authentication errors - clear tokens and retry once
            if (status === 401 || status === 403) {
              logger.warn(
                `Authentication failed with status ${status}, clearing tokens`
              );
              authService.clearTokens();

              if (attemptNumber === 1) {
                throw error;
              } else {
                bail(error);
                return;
              }
            }

            if (status >= 400 && status < 500) {
              logger.error(`Client error ${status}, not retrying`);
              bail(error);
              return;
            }

            if (status >= 500) {
              logger.warn(`Server error ${status}, attempt ${attemptNumber}`);
              throw error; // Will trigger retry
            }
          }

          // Network errors - retry
          if (
            error.code === "ECONNRESET" ||
            error.code === "ETIMEDOUT" ||
            error.code === "ENOTFOUND"
          ) {
            logger.warn(
              `Network error: ${error.message}, attempt ${attemptNumber}`
            );
            throw error; // Will trigger retry
          }

          bail(error);
        }
      },
      {
        retries: 3,
        factor: 2,
        minTimeout: 2000,
        maxTimeout: 15000,
        randomize: true,
        onRetry: (error, attemptNumber) => {
          logger.info(
            `Retry attempt ${attemptNumber} for pollution API due to: ${error.message}`
          );
        },
      }
    );

    const result = {
      results: data.cities || data.results || data || [],
      meta: {
        page: data.page || data.meta?.page || page,
        totalPages: data.totalPages || data.meta?.totalPages || 1,
        limit: data.limit || data.meta?.limit || limit,
        total:
          data.total ||
          data.meta?.total ||
          (data.cities || data.results || data || []).length,
      },
    };

    return result;
  } catch (error) {
    logger.error("Error fetching pollution data:", error.message);

    if (error.response) {
      logger.error(`API responded with status: ${error.response.status}`);
      logger.error(`API response data:`, error.response.data);
    }

    return {
      results: [],
      meta: {
        page: page,
        limit: limit,
        total: 0,
      },
    };
  }
}

module.exports = {
  fetchPollutionData,
};
