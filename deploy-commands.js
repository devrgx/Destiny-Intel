const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Client, Intents } = require('discord.js');
const fs = require('fs');
const clientId = '1367825593114038272';
const guildId = '1367601483775869048'; // Nur notwendig für Guild-Commands
require('dotenv').config()
const token = process.env.TOKEN;

const args = process.argv.slice(2); // Holt sich die Argumente der Kommandozeile

// Bestimmt, ob globale oder Guild-spezifische Commands registriert werden
const isGlobal = args.includes('--global');

const commands = [
    new SlashCommandBuilder()
      .setName('emblem')
      .setDescription('Zeigt Infos zu einem Destiny 2 Emblem')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name des Emblems')
          .setAutocomplete(true)
          .setRequired(true)
      ),
    // Weitere Befehle können hier hinzugefügt werden
  ]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Starte das Registrieren der Commands... (Global: ${isGlobal})`);

    // Registrierung der Slash-Commands
    if (isGlobal) {
      // Globale Commands
      await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
      console.log('Globale Commands wurden registriert!');
    } else {
      // Guild-spezifische Commands
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log('Guild-spezifische Commands wurden registriert!');
    }
  } catch (error) {
    console.error(error);
  }
})();