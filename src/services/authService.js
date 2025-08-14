const axios = require("axios");
const logger = require("../utils/logger");
const cache = require("../utils/cache");

const API_BASE_URL = process.env.API_BASE_URL;
const API_USERNAME = process.env.API_USERNAME;
const API_PASSWORD = process.env.API_PASSWORD;
let tokenStore = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
};

async function login() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      {
        username: API_USERNAME,
        password: API_PASSWORD,
      },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        timeout: 10000,
      }
    );
    const { token, refreshToken, expiresIn } = response.data;

    tokenStore.accessToken = token;
    tokenStore.refreshToken = refreshToken;
    tokenStore.expiresAt = Date.now() + expiresIn * 1000 - 60000;

    return tokenStore;
  } catch (error) {
    throw error;
  }
}

async function refreshAccessToken() {
  try {
    if (!tokenStore.refreshToken) {
      throw new Error("No refresh token available, need to login first");
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {
        refreshToken: tokenStore.refreshToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        timeout: 10000,
      }
    );

    const { access_token, expires_in } = response.data;

    tokenStore.accessToken = access_token;
    tokenStore.expiresAt = Date.now() + expires_in * 1000 - 60000; // Subtract 1 minute for safety margin
    return response.data;
  } catch (error) {
    logger.error("Failed to refresh token:", error.message);
    if (error.response) {
      logger.error("Refresh response:", error.response.data);
    }

    tokenStore.accessToken = null;
    tokenStore.refreshToken = null;
    tokenStore.expiresAt = null;
    throw error;
  }
}

async function getValidAccessToken() {
  if (
    !tokenStore.accessToken ||
    !tokenStore.expiresAt ||
    Date.now() >= tokenStore.expiresAt
  ) {
    if (tokenStore.refreshToken) {
      try {
        await refreshAccessToken();
        return tokenStore.accessToken;
      } catch (error) {
        logger.warn("Token refresh failed, attempting fresh login");
      }
    }
    const loginResponse = await login();
    return loginResponse.accessToken;
  }
  return tokenStore.accessToken;
}

function clearTokens() {
  tokenStore.accessToken = null;
  tokenStore.refreshToken = null;
  tokenStore.expiresAt = null;
}

module.exports = {
  login,
  refreshAccessToken,
  getValidAccessToken,
  clearTokens,
  get tokenStore() {
    return { ...tokenStore };
  },
};
