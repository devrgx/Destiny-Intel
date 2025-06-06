const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /oauth/start:
 *   get:
 *     summary: Redirects user to Bungie OAuth login
 *     parameters:
 *       - in: query
 *         name: discordId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Discord ID of the user
 *     responses:
 *       302:
 *         description: Redirect to Bungie OAuth
 */
router.get("/oauth/start", (req, res) => {
  const { discordId } = req.query;

  if (!discordId) {
    return res.status(400).json({ error: "Missing Discord ID" });
  }

  const bungieAuthURL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${
    process.env.BUNGIE_CLIENT_ID
  }&response_type=code&redirect_uri=${encodeURIComponent(
    process.env.BUNGIE_REDIRECT_URI
  )}&state=${discordId}`;

  res.redirect(bungieAuthURL);
});

module.exports = router;