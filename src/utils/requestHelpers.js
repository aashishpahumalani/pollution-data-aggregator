const countries = {
  PL: "Poland",
  DE: "Germany",
  ES: "Spain",
  FR: "France",
};

function validateRequest(req) {
  if (!req.query.country || !countries[req.query.country]) {
    throw new Error(
      "Invalid country code. Supported countries: PL (Poland), DE (Germany), ES (Spain), FR (France)"
    );
  }

  return {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    country: req.query.country,
  };
}

function buildPollutionOptions(country) {
  return {
    page: 1,
    limit: 50,
    country: country,
  };
}

module.exports = {
  validateRequest,
  buildPollutionOptions,
  countries,
};
