const cityValidator = require("./cityValidator");
const logger = require("./logger");

function normalizeCityNames(cities) {
  const normalizedCities = cities.map((city) => ({
    ...city,
    name: cityValidator.cleanCityName(city.name),
    originalName: city.name,
  }));
  return normalizedCities;
}

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

  const deduplicated = Array.from(cityMap.values());
  return deduplicated;
}

function filterValidCities(cities, country) {
  const validCities = cities.filter((city) =>
    cityValidator.isValidCity(city, country)
  );
  return validCities;
}

function sortCitiesByPollution(cities) {
  return cities.sort((a, b) => {
    const aPollution = parseFloat(a.pollution || 0);
    const bPollution = parseFloat(b.pollution || 0);
    return bPollution - aPollution;
  });
}

module.exports = {
  normalizeCityNames,
  deduplicateCities,
  filterValidCities,
  sortCitiesByPollution,
};
