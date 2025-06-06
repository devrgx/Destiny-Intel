const express = require("express");
const User = require("../models/User");

const router = express.Router();

/**
 * Beispielroute: alle verknüpften Nutzer anzeigen (optional)
 */
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-accessToken -refreshToken");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Failed to fetch users.");
  }
});

/**
 * Benutzerinfo nach Discord-ID
 */
router.get("/:discordId", async (req, res) => {
  try {
    const user = await User.findOne({ discordId: req.params.discordId }).select("-accessToken -refreshToken");
    if (!user) return res.status(404).send("User not found");
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).send("Failed to fetch user.");
  }
});

module.exports = router;