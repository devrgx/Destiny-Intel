const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const clientId = '1367825593114038272';
const guildId = '1367601483775869048';
const token = process.env.TOKEN;
const isGlobal = process.argv.includes('--global');

console.log("📦 Token geladen:", token ? "✅" : "❌ NICHT GEFUNDEN!");
console.log("🌍 Modus:", isGlobal ? "Global" : "Guild");

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

console.log(`📂 Gefundene Command-Dateien: ${commandFiles.length}`, commandFiles);

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    if ('data' in command && 'execute' in command) {
      const json = command.data.toJSON();
      commands.push(json);
      console.log(`✅ ${file} geladen:`, json.name);
    } else {
      console.warn(`[⚠️ WARNUNG] ${file} exportiert kein gültiges Command-Objekt.`);
    }
  } catch (err) {
    console.error(`❌ Fehler beim Laden von ${file}:`, err);
  }
}

console.log(`📦 Insgesamt geladene Commands: ${commands.length}`);
console.log(commands.map(c => c.name));

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`🚀 Starte Deploy... (Ziel: ${isGlobal ? "Global" : "Guild"})`);

    const route = isGlobal
      ? Routes.applicationCommands(clientId)
      : Routes.applicationGuildCommands(clientId, guildId);

    console.log("📡 Ziel-Route:", route);

    const result = await rest.put(route, { body: commands });

    console.log(`✅ Erfolgreich deployed! Registrierte Commands: ${Array.isArray(result) ? result.length : 'Unbekannt'}`);
  } catch (error) {
    console.error('❌ Fehler beim Deployen:', error);
    if (error.response && error.response.data) {
      console.error('📨 Discord Response:', error.response.data);
    }
  }
})();