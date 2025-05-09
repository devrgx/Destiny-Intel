const { Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const clientId = '1367825593114038272';
const guildId = '1367601483775869048'; // Nur notwendig für Guild-Commands
require('dotenv').config()
const token = process.env.TOKEN;

const args = process.argv.slice(2);
const isGlobal = args.includes('--global');

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Starte das Löschen der Commands... (Global: ${isGlobal})`);

    if (isGlobal) {
      // Löscht alle globalen Commands
      await rest.put(Routes.applicationCommands(clientId), {
        body: [],
      });
      console.log('Globale Commands wurden gelöscht!');
    } else {
      // Löscht alle Guild-spezifischen Commands
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: [],
      });
      console.log('Guild-spezifische Commands wurden gelöscht!');
    }
  } catch (error) {
    console.error(error);
  }
})();