const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const { getValidAccessToken } = require("../utils/tokenManager");
require("dotenv").config();

const router = express.Router();

// 📄 GET /bungie/data – Bungie-Profil abrufen
router.get("/data", async (req, res) => {
  const { discordId } = req.query;
  if (!discordId) return res.status(400).send("Missing Discord ID");

  const token = await getValidAccessToken(discordId);
  if (!token) return res.status(400).send("No valid token found.");

  try {
    const user = await User.findOne({ discordId });
    if (!user || !user.destinyMembershipId) {
      return res.status(404).send("Destiny account not linked.");
    }

    const result = await axios.get(
      `https://www.bungie.net/Platform/Destiny2/1/Profile/${user.destinyMembershipId}/?components=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-API-Key": process.env.BUNGIE_API_KEY,
        },
      }
    );

    res.json(result.data);
  } catch (err) {
    console.error("Bungie API Error:", err.response?.data || err.message);
    res.status(500).send("Failed to fetch Bungie data.");
  }
});

// 🔁 GET /bungie/callback – Bungie OAuth Redirect
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send("Missing authorization code or state.");
  }

  try {
    // ⬇️ Fix: Form-Body mit URLSearchParams (nicht `params`)
    const response = await axios.post(
      "https://www.bungie.net/platform/app/oauth/token/",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.BUNGIE_CLIENT_ID,
        client_secret: process.env.BUNGIE_CLIENT_SECRET,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-API-Key": process.env.BUNGIE_API_KEY,
        },
      }
    );

    const tokens = response.data;

    const userInfo = await axios.get(
      "https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "X-API-Key": process.env.BUNGIE_API_KEY,
        },
      }
    );

    const destinyMemberships = userInfo.data.Response.destinyMemberships || [];
    const primaryId = userInfo.data.Response.primaryMembershipId;

    const primaryMembership = destinyMemberships.find(m => m.membershipId === primaryId)
      || destinyMemberships[0]; // Fallback

    const displayName = primaryMembership?.displayName || "Unknown";
    const membershipType = primaryMembership?.membershipType;
    const destinyId = primaryMembership?.membershipId;
    const bungieId = userInfo.data.Response.bungieNetUser?.membershipId || null;

    await User.findOneAndUpdate(
      { discordId: state },
      {
        discordId: state,
        bungieMembershipId: bungieId,
        destinyMembershipId: destinyId,
        membershipType: membershipType, // <--- NEU!
        displayName: displayName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenCreatedAt: Date.now(),
        tokenExpiresIn: tokens.expires_in,
        tokenExpires: Date.now() + tokens.expires_in * 1000,
      },
      { upsert: true }
    );

    return res.send("✅ Your Bungie account has been successfully linked. You may now return to Discord.");
  } catch (err) {
    console.error("OAuth callback error:", err.response?.data || err.message);
    return res.status(500).send("❌ Something went wrong while linking your account.");
  }
});

module.exports = router;