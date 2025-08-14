const logger = require("./logger");
const cache = require("./cache");

function cleanCityName(name) {
  if (!name || typeof name !== "string") {
    return "";
  }

  return name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\(.*?\)/g, "") // remove text in parentheses
    .replace(/[^a-zA-Z\s-]/g, "") // keep only letters, spaces, and hyphens
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim() // trim again after cleaning
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isValidCity(entry, country) {
  try {
    const cityName = entry.name;

    if (!cityName) {
      return false;
    }

    if (cityName.length < 2) {
      return false;
    }

    // Check cached invalid cities first (fastest check)
    const invalidCacheKey = `wikipedia_invalid_cities_${country}`;
    const invalidCities = cache.get(invalidCacheKey) || [];

    if (invalidCities.includes(cityName)) {
      return false;
    }

    return true;
  } catch (error) {
    logger.warn("Error validating city entry:", error.message);
    return false;
  }
}

module.exports = {
  isValidCity,
  cleanCityName,
};
