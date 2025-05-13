const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { getValidAccessToken } = require("./utils/tokenManager");

const mongoose = require("mongoose");
const Emblem = require("./models/Emblem");  // Dein Mongoose-Modell für Embleme

const app = express();
const PORT = 3000;

const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "D2 Emblem API",
    version: "1.0.0",
    description: "API zur Anzeige von Destiny 2 Emblemen",
  },
  servers: [
    {
      url: "https://api.d2emblem.info", // Lokale URL: "http://localhost:3000"
    },
  ],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ["./server.js"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// MongoDB-Verbindung
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emblems', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB verbunden'))
  .catch((err) => console.log('Fehler bei der MongoDB-Verbindung:', err));


const usersFilePath = path.join(__dirname, "./data/users.json");

function loadUsers() {
  if (!fs.existsSync(usersFilePath)) return {};
  return JSON.parse(fs.readFileSync(usersFilePath));
}

function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// ✅ Auth-Start-Router
app.get("/auth/start", (req, res) => {
  const discordId = req.query.discordId;
  if (!discordId) return res.status(400).send("Discord ID fehlt.");

  const redirectUri = `${process.env.BASE_URL}/auth/bungie/callback`;
  const state = discordId;

  const authUrl = `https://www.bungie.net/en/oauth/authorize?client_id=${
    process.env.CLIENT_ID
  }&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;

  return res.redirect(authUrl);
});

// ✅ OAuth Callback
app.get("/auth/bungie/callback", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  if (!code || !state) {
    return res.status(400).send("Missing code or state.");
  }

  try {
    const tokenResponse = await axios.post(
      "https://www.bungie.net/platform/app/oauth/token/",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userInfo = await axios.get(
      "https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "X-API-Key": process.env.API_KEY,
        },
      }
    );

    const bungie = userInfo.data.Response;
    const discordId = state;

    const destinyAccount = bungie.destinyMemberships[0];
    if (!destinyAccount)
      return res.status(500).send("No Destiny account found.");

    const users = loadUsers();

    users[discordId] = {
      bungieMembershipId: bungie.bungieNetUser.membershipId,
      destinyMembershipId: destinyAccount.membershipId,
      displayName: bungie.bungieNetUser.displayName,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresIn: expires_in,
      tokenCreatedAt: Date.now(),
    };

    saveUsers(users);

    res.send(`
      <h2>✅ Linked!</h2>
      <p>Discord ID: ${discordId}</p>
      <p>Bungie: ${bungie.bungieNetUser.displayName}</p>
      <p>You can now return to Discord.</p>
    `);
  } catch (error) {
    const desc = error.response?.data?.error_description || error.message;
    console.error("OAuth Error:", error.response?.data || error.message);
    res.status(500).send(`
    <h2>❌ OAuth Error</h2>
    <p>${desc}</p>
    <pre>${JSON.stringify(error.response?.data, null, 2)}</pre>
  `);
    console.error("OAuth Error:", error.response?.data || error.message);
    res.status(500).send("OAuth authentication failed.");
  }
});

// ✅ Fehleranzeige
app.get("/auth/error", (req, res) => {
  const message =
    req.query.message || "Ein unbekannter Fehler ist aufgetreten.";
  res.send(`
    <h2>⚠️ Login Error</h2>
    <p>${message}</p>
    <a href="/auth/start"><button>Try again</button></a>
  `);
});

// ✅ Test-Ressource (Bungie-Daten abrufen)
app.get("/bungie-data", async (req, res) => {
  const discordId = req.query.discordId;
  const token = await getValidAccessToken(discordId);
  if (!token) return res.status(400).send("No valid token found.");

  try {
    const data = await axios.get(
      "https://www.bungie.net/Platform/Destiny2/1/Profile/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-API-Key": process.env.API_KEY,
        },
      }
    );
    res.json(data.data);
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    res.status(500).send("Failed to fetch Bungie data.");
  }
});

/**
 * @swagger
 * /emblem:
 *   get:
 *     summary: Returns all emblems
 *     parameters:
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Show only available emblems (true/false)
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter emblems by source (e.g., "Event", "Achievement")
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter emblems by name
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Returns a single emblem based on the ID
 *     responses:
 *       200:
 *         description: Successful response with a list of emblems
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   available:
 *                     type: boolean
 *                   source:
 *                     type: string
 *                   requirements:
 *                     type: string
 *       404:
 *         description: Emblem not found with the provided ID
 *       500:
 *         description: Error fetching emblem data
 */

app.get("/emblem", async (req, res) => {
  try {
    let emblems = await Emblem.find();  // Hole alle Embleme

    // Filter nach "available" (nur verfügbare Embleme)
    if (req.query.available) {
      const availableFilter = req.query.available === "true";
      emblems = emblems.filter(emblem => emblem.available === availableFilter);
    }

    // Filter nach "source"
    if (req.query.source) {
      const sourceFilter = req.query.source.toLowerCase();
      emblems = emblems.filter(emblem => emblem.source && emblem.source.toLowerCase().includes(sourceFilter));
    }

    // Filter nach "name"
    if (req.query.name) {
      const nameFilter = req.query.name.toLowerCase();
      emblems = emblems.filter(emblem => emblem.name.toLowerCase().includes(nameFilter));
    }

    // Filter nach "id"
    if (req.query.id) {
      const emblem = emblems.find(e => e.id === req.query.id);
      if (!emblem) return res.status(404).send("Emblem not found.");
      return res.json(emblem);
    }

    res.json(emblems);  // Zeige gefilterte Embleme
  } catch (error) {
    console.error("Error fetching emblem data:", error);
    res.status(500).send("Failed to fetch emblem data.");
  }
});

app.listen(PORT, () => {
  console.log(`OAuth Server ready at http://localhost:${PORT}`);
});
/* Test */
