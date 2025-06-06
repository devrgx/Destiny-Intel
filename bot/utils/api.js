const axios = require("axios");

const BASE_URL = process.env.API_BASE_URL || "https://api.d2emblem.info";
const TIMEOUT = 5000; // 5 Sekunden Timeout

/**
 * Führt einen Request an die Backend-API aus.
 * @param {string} endpoint - API-Endpunkt, z.B. /user/:id
 * @param {string} method - HTTP-Methode ("GET", "POST", etc.)
 * @param {object} [data] - Optional: Query-Parameter oder Body
 * @returns {Promise<object|null>}
 */
async function fetchFromAPI(endpoint, method = "GET", data = null) {
  try {
    const url = `${BASE_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;

    const config = {
      method: method.toUpperCase(),
      url,
      timeout: TIMEOUT,
    };

    if (config.method === "GET" && data) {
      config.params = data;
    } else if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    const message = error.response?.data || error.message;
    console.error(`❌ API-Fehler (${method} ${endpoint}):`, message);
    return null;
  }
}

module.exports = { fetchFromAPI };