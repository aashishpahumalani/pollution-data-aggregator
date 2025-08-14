const wikipediaService = require("../services/wikipediaService");
const pollutionService = require("../services/pollutionService");
const { updateInvalidCitiesCache } = require("./cacheHelpers");
const logger = require("./logger");

async function fetchRawPollutionData(pollutionOptions, country) {
  const rawData = await pollutionService.fetchPollutionData(pollutionOptions);

  if (!rawData || !rawData.results || rawData.results.length === 0) {
    logger.warn(`No pollution data found for ${country}`);
    throw new Error(`No pollution data found for country: ${country}`);
  }

  return rawData;
}

async function enrichWithWikipediaData(cities, country) {
  const enrichedCities = [];
  const newInvalidCities = [];

  for (let city of cities) {
    try {
      const description = await wikipediaService.getCityDescription(
        city.name,
        country
      );

      if (description) {
        enrichedCities.push({
          ...city,
          description: description,
        });
      } else {
        newInvalidCities.push(city.name.toLowerCase());
      }
    } catch (error) {
      logger.warn(`Failed to get description for ${city.name}:`, error.message);
      newInvalidCities.push(city.name.toLowerCase());
    }
  }

  updateInvalidCitiesCache(newInvalidCities, country);
  return enrichedCities;
}

module.exports = {
  fetchRawPollutionData,
  enrichWithWikipediaData,
};
