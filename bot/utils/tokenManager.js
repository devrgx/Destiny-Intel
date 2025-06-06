const axios = require("axios");
const User = require("../models/User");
require("dotenv").config();
console.log("🔎 BUNGIE_CLIENT_ID:", process.env.BUNGIE_CLIENT_ID);
const BUNGIE_CLIENT_ID = process.env.BUNGIE_CLIENT_ID;
const BUNGIE_CLIENT_SECRET = process.env.BUNGIE_CLIENT_SECRET;
const BUNGIE_API_URL = "https://www.bungie.net/platform";

// 🔄 Token verlängern und speichern
async function refreshToken(user) {
  try {
    const response = await axios.post(
      `${BUNGIE_API_URL}/App/OAuth/Token/`,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: user.refreshToken,
        client_id: BUNGIE_CLIENT_ID,
        client_secret: BUNGIE_CLIENT_SECRET,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = response.data;

    // ⬇️ Token-Infos aktualisieren
    user.accessToken = data.access_token;
    user.refreshToken = data.refresh_token;
    user.tokenExpires = Date.now() + data.expires_in * 1000;
    user.tokenCreatedAt = Date.now();
    user.tokenExpiresIn = data.expires_in;

    await user.save();

    console.log(`🔄 Token refreshed for ${user.discordId}`);
    return user.accessToken;
  } catch (error) {
    console.error("❌ Error refreshing token:", error.response?.data || error.message);
    throw new Error("Failed to refresh token.");
  }
}

// ✅ Holt gültigen Token (aktualisiert falls abgelaufen)
async function getValidAccessToken(discordId) {
  const user = await User.findOne({ discordId });

  if (!user) {
    throw new Error("❌ No linked Bungie account found for this user.");
  }

  const expiresAt = user.tokenExpires || (user.tokenCreatedAt + user.tokenExpiresIn * 1000);
  const isExpired = !expiresAt || Date.now() >= expiresAt;

  return isExpired ? await refreshToken(user) : user.accessToken;
}

module.exports = {
  getValidAccessToken,
};