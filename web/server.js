const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { getValidAccessToken } = require("../utils/tokenManager"); // Importiere den Token-Manager

const app = express();
const PORT = 3000; // Oder 443, wenn du SSL aktiv nutzt

const usersFilePath = path.join(__dirname, "../data/users.json");

// Helfer zum Laden/Speichern von Benutzerdaten
function loadUsers() {
  if (!fs.existsSync(usersFilePath)) return {};
  return JSON.parse(fs.readFileSync(usersFilePath));
}

function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// Authentifizierungs-Callback (nach dem Login bei Bungie)
app.get("/auth/bungie/callback", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state; // Discord-User-ID

  if (!code || !state) {
    return res.status(400).send("Missing code or state");
  }

  try {
    // Access Token anfordern
    const tokenResponse = await axios.post(
      "https://www.bungie.net/platform/app/oauth/token/",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token;
    const tokenExpiresIn = tokenResponse.data.expires_in;

    // Benutzerinfo abrufen
    const userInfoResponse = await axios.get(
      "https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-API-Key": process.env.API_KEY,
        },
      }
    );

    const bungieData = userInfoResponse.data.Response;
    const discordId = state;

    const users = loadUsers();

    // Nur displayName, bungieMembershipId, destinyMembershipId und Tokens extrahieren und speichern
    const destinyAccount =
      bungieData.destinyMemberships.length > 0
        ? bungieData.destinyMemberships[0]
        : null;

    if (destinyAccount) {
      users[discordId] = {
        bungieMembershipId: bungieData.bungieNetUser.membershipId, // Bungie Net Membership ID
        destinyMembershipId: destinyAccount.membershipId, // Destiny Membership ID
        displayName: bungieData.bungieNetUser.displayName, // Bungie Display Name
        accessToken: accessToken, // Access Token
        refreshToken: refreshToken, // Refresh Token
        tokenExpiresIn: tokenExpiresIn, // Token Expiration Time (in seconds)
        tokenCreatedAt: Date.now(), // Zeitpunkt der Erstellung des Tokens (in ms)
      };

      saveUsers(users);

      res.send(
        `Successfully linked Discord (${discordId}) with Bungie (${bungieData.bungieNetUser.displayName}).\n\n\nYou can close this window and return to Discord!`
      );
    } else {
      res.status(500).send("No active Destiny account found.");
    }
  } catch (error) {
    console.error(error.response?.data || error.message);

    app.get("/auth/start", (req, res) => {
      const discordId = req.query.discordId; // Dies wird übergeben, wenn der Benutzer den Link mit seiner Discord-ID öffnet.

      if (!discordId) {
        return res.status(400).send("Discord ID fehlt.");
      }

      const redirectUri = `${process.env.BASE_URL}/auth/bungie/callback`; // Die URL, auf die Bungie den Benutzer nach erfolgreichem Login weiterleitet.
      const state = discordId; // Hier verwenden wir die Discord-ID als 'state', damit wir sie später in der Callback-Route wiederfinden.

      const authorizationUrl = `https://www.bungie.net/en/oauth/authorize?client_id=${
        process.env.CLIENT_ID
      }&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}`;

      // Leite den Benutzer zur Bungie-Authentifizierungsseite weiter
      res.redirect(authorizationUrl);
    });

    // Fehlerbehandlung für "DestinyThrottledByGameServer"
    if (
      error.response?.data?.error_description === "DestinyThrottledByGameServer"
    ) {
      const errorMsg =
        "Bungie servers are currently overloaded. Please try again in a few minutes. This is not a users nor a Emblem Intel fault.";
      const message = encodeURIComponent(errorMsg);
      return res.redirect(`/auth/error?message=${message}`);
    }

    // Andere Fehlerbehandlung
    res.status(500).send("Fehler bei der Bungie-Authentifizierung.");
  }
});

app.get("/auth/error", (req, res) => {
  const message =
    req.query.message || "Ein unbekannter Fehler ist aufgetreten.";

  res.send(`
      <html>
          <head><title>Fehler bei der Anmeldung</title></head>
          <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
              <h2>⚠️ Login issues</h2>
              <p>${message}</p>
              <a href="/auth/start"><button style="padding: 10px 20px; font-size: 16px;">Try again</button></a>
          </body>
      </html>
  `);
});

// Beispielroute zum Abrufen von Bungie-Daten mit einem gültigen Access Token
app.get("/bungie-data", async (req, res) => {
  const discordId = req.query.discordId; // Discord User ID

  // Hole einen gültigen Access Token für den Benutzer
  const accessToken = await getValidAccessToken(discordId);

  if (!accessToken) {
    return res.status(400).send("Fehler beim Abrufen eines gültigen Tokens.");
  }

  try {
    // Beispiel einer Anfrage an die Bungie-API mit dem validierten Access Token
    const bungieDataResponse = await axios.get(
      "https://www.bungie.net/Platform/Destiny2/1/Profile/",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-API-Key": process.env.API_KEY,
        },
      }
    );

    // Hier kannst du die Daten nach Bedarf weiterverarbeiten
    res.json(bungieDataResponse.data);
  } catch (error) {
    console.error(
      "Fehler beim Abrufen von Bungie-Daten:",
      error.response?.data || error.message
    );
    res.status(500).send("Fehler beim Abrufen der Bungie-Daten.");
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
