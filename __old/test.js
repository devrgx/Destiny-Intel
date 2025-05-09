const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
const clientId = '1367825593114038272';

(async () => {
  try {
    const commands = await rest.get(Routes.applicationCommands(clientId));
    console.log("✅ Globale Commands gefunden:", commands.length);
  } catch (err) {
    console.error("❌ Fehler bei Anfrage:", err);
  }
})();