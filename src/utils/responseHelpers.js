const { countries } = require("./requestHelpers");

function paginateResults(enrichedCities, page, limit) {
  const actualResultsCount = enrichedCities.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCities = enrichedCities.slice(startIndex, endIndex);

  return {
    actualResultsCount,
    paginatedCities,
  };
}

function formatResponse(paginatedCities, page, limit, total, country) {
  return {
    page: page,
    limit: limit,
    total: total,
    cities: paginatedCities.map((city) => ({
      name: city.name,
      country: countries[country],
      pollution: city.pollution,
      description: city.description,
    })),
  };
}

module.exports = {
  paginateResults,
  formatResponse,
};
