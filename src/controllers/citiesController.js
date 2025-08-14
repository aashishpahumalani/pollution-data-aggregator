const pollutionService = require("../services/pollutionService");
const wikipediaService = require("../services/wikipediaService");
const cityValidator = require("../utils/cityValidator");
const cache = require("../utils/cache");
const logger = require("../utils/logger");

const countries = {
  PL: "Poland",
  DE: "Germany",
  ES: "Spain",
  FR: "France",
};

const getMostPollutedCities = async (req, res, next) => {
  try {
    if (!req.query.country && !countries[req.query.country]) {
      return res.status(400).json({
        error:
          "Invalid country code. Supported countries: PL (Poland), DE (Germany), ES (Spain), FR (France)",
      });
    }
    // Get parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const country = req.query.country;

    const cacheKey = `pollution_data_${country}`;

    // Prepare options for pollution service
    const pollutionOptions = {
      page: 1,
      limit: 50,
      country: country,
    };

    // Check cache first
    const cachedData = cache.get(cacheKey);
    let enrichedCities = cachedData;
    if (!cachedData) {
      // 1. Fetch raw pollution data with API parameters
      const rawData = await pollutionService.fetchPollutionData(
        pollutionOptions
      );
      if (!rawData || !rawData.results || rawData.results.length === 0) {
        logger.warn(`No pollution data found for ${country}`);
        return res.status(404).json({
          error: "No pollution data found",
          country: country,
        });
      }

      // 2. Normalize city names
      const normalizedCities = rawData.results.map((city) => ({
        ...city,
        name: cityValidator.cleanCityName(city.name),
        originalName: city.name, // Keep original for debugging
      }));

      // 3. Remove duplicates after normalization (keep highest pollution)
      const deduplicatedCities = deduplicateCities(normalizedCities);

      // 4. Filter and validate cities
      const validCities = deduplicatedCities.filter((city) =>
        cityValidator.isValidCity(city, country)
      );

      // 5. Sort cities by pollution level (highest first)
      const sortedCities = validCities.sort((a, b) => {
        const aPollution = parseFloat(a.pollution || 0);
        const bPollution = parseFloat(b.pollution || 0);
        return bPollution - aPollution;
      });

      // 6. Enrich with Wikipedia descriptions
      enrichedCities = await enrichWithWikipediaData(sortedCities, country);

      cache.set(cacheKey, enrichedCities);
    }

    const actualResultsCount = enrichedCities.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCities = enrichedCities.slice(startIndex, endIndex);

    const response = {
      page: page,
      limit: limit,
      total: actualResultsCount,
      cities: paginatedCities.map((city) => ({
        name: city.name,
        country: countries[country],
        pollution: city.pollution,
        description: city.description,
      })),
    };
    res.json(response);
  } catch (error) {
    logger.error("Error in getMostPollutedCities:", error);
    next(error);
  }
};

function deduplicateCities(cities) {
  const cityMap = new Map();

  cities.forEach((city) => {
    const existing = cityMap.get(city.name);
    if (
      !existing ||
      parseFloat(city.pollution || 0) > parseFloat(existing.pollution || 0)
    ) {
      cityMap.set(city.name, city);
    }
  });
  return Array.from(cityMap.values());
}

async function enrichWithWikipediaData(cities, country) {
  const enrichedCities = [];
  const invalidCacheKey = `wikipedia_invalid_cities_${country}`;

  const invalidCitiesCache = cache.get(invalidCacheKey) || [];
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
      newInvalidCities.push(city.name.toLowerCase());
    }
  }

  // Merge existing invalid cities with new ones and update cache
  if (newInvalidCities.length > 0) {
    const mergedInvalidCities = [
      ...new Set([...invalidCitiesCache, ...newInvalidCities]),
    ];
    cache.set(invalidCacheKey, mergedInvalidCities);
  }
  return enrichedCities;
}

module.exports = {
  getMostPollutedCities,
};
