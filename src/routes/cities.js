const express = require("express");
const router = express.Router();
const citiesController = require("../controllers/citiesController");

router.get("/", citiesController.getMostPollutedCities);

module.exports = router;
