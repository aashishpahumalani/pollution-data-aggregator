const cache = require("./cache");
const logger = require("./logger");

function getCachedData(country) {
  const cacheKey = `pollution_data_${country}`;
  return {
    data: cache.get(cacheKey),
    cacheKey: cacheKey,
  };
}

function updateInvalidCitiesCache(newInvalidCities, country) {
  if (newInvalidCities.length === 0) return;

  const invalidCacheKey = `wikipedia_invalid_cities_${country}`;
  const invalidCitiesCache = cache.get(invalidCacheKey) || [];

  const mergedInvalidCities = [
    ...new Set([...invalidCitiesCache, ...newInvalidCities]),
  ];

  cache.set(invalidCacheKey, mergedInvalidCities);
}

module.exports = {
  getCachedData,
  updateInvalidCitiesCache,
};
