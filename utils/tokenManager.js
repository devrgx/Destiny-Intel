const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const usersFilePath = path.join(__dirname, '../data/users.json');

function loadUsers() {
    if (!fs.existsSync(usersFilePath)) return {};
    return JSON.parse(fs.readFileSync(usersFilePath));
}

function saveUsers(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// Gibt gültigen access_token zurück oder erneuert ihn
async function getValidAccessToken(discordId) {
    const users = loadUsers();
    const user = users[discordId];
    if (!user) return null;

    const now = Date.now();
    const tokenAge = (now - user.tokenCreatedAt) / 1000; // in Sekunden

    if (tokenAge < user.tokenExpiresIn - 60) {
        return user.accessToken; // Noch gültig
    }

    // Token ist abgelaufen → erneuern
    try {
        const response = await axios.post('https://www.bungie.net/platform/app/oauth/token/', new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: user.refreshToken,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // Speichern
        user.accessToken = response.data.access_token;
        user.refreshToken = response.data.refresh_token;
        user.tokenExpiresIn = response.data.expires_in;
        user.tokenCreatedAt = now;

        saveUsers(users);
        return user.accessToken;

    } catch (err) {
        console.error(`Fehler beim Aktualisieren des Tokens für ${discordId}:`, err.response?.data || err.message);
        return null;
    }
}

module.exports = { getValidAccessToken };