// Import utility modules
const {
  validateRequest,
  buildPollutionOptions,
} = require("../utils/requestHelpers");
const { getCachedData } = require("../utils/cacheHelpers");
const {
  fetchRawPollutionData,
  enrichWithWikipediaData,
} = require("../utils/enrichmentHelpers");
const {
  normalizeCityNames,
  deduplicateCities,
  filterValidCities,
  sortCitiesByPollution,
} = require("../utils/dataProcessors");
const { paginateResults, formatResponse } = require("../utils/responseHelpers");
const cache = require("../utils/cache");
const logger = require("../utils/logger");

const getMostPollutedCities = async (req, res, next) => {
  try {
    const { page, limit, country } = validateRequest(req);
    const { data: cachedData, cacheKey } = getCachedData(country);

    let enrichedCities = cachedData;

    if (!cachedData) {
      const pollutionOptions = buildPollutionOptions(country);
      const rawData = await fetchRawPollutionData(pollutionOptions, country);

      const normalizedCities = normalizeCityNames(rawData.results);
      const deduplicatedCities = deduplicateCities(normalizedCities);
      const validCities = filterValidCities(deduplicatedCities, country);
      const sortedCities = sortCitiesByPollution(validCities);

      enrichedCities = await enrichWithWikipediaData(sortedCities, country);
      cache.set(cacheKey, enrichedCities);
    }

    const { actualResultsCount, paginatedCities } = paginateResults(
      enrichedCities,
      page,
      limit
    );
    const response = formatResponse(
      paginatedCities,
      page,
      limit,
      actualResultsCount,
      country
    );
    res.json(response);
  } catch (error) {
    if (
      error.message.includes("Invalid country code") ||
      error.message.includes("No pollution data found")
    ) {
      return res
        .status(error.message.includes("Invalid country code") ? 400 : 404)
        .json({
          error: error.message,
        });
    }
    logger.error("Error in getMostPollutedCities:", error);
    next(error);
  }
};

module.exports = {
  getMostPollutedCities,
};
