const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const clientId = '1367825593114038272';
const guildId = '1367601483775869048';
const token = process.env.TOKEN;
const isGlobal = process.argv.includes('--global');

// Lade alle Commands aus dem ./commands Ordner
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[WARN] Die Datei ${file} exportiert keinen gültigen Slash-Command.`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Deploy starte... (Global: ${isGlobal})`);

    if (isGlobal) {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('✅ Globale Commands deployed!');
    } else {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log('✅ Guild Commands deployed!');
    }
  } catch (error) {
    console.error('❌ Fehler beim Deployen:', error);
  }
})();