const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const clientId = '1367825593114038272';
const guildId = '1367601483775869048';
const token = process.env.TOKEN;

const args = process.argv.slice(2);
const action = args[0]; // deploy | delete | status
const isGlobal = args.includes('--global');
const BATCH_SIZE = 3;

console.log(" Token geladen:", token ? "✅" : "❌ NICHT GEFUNDEN!");
console.log(" Aktion:", action);
console.log(" Modus:", isGlobal ? "Global" : "Guild");

const rest = new REST({ version: '10' }).setToken(token);
rest.on('rateLimited', console.log)

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const deployBatchWithRetry = async (commandsBatch, route, batchIndex, maxRetries = 3) => {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      console.log(` Deploy Batch ${batchIndex + 1} (${commandsBatch.length} Commands)...`);
      const result = await rest.put(route, { body: commandsBatch });
      console.log(` Batch ${batchIndex + 1} erfolgreich deployed. Commands: ${result.length}`);
      return;
    } catch (error) {
      if (error.status === 429) {
        const retryAfter = error.data?.retry_after ?? 5;
        console.warn(` Rate-Limit für Batch ${batchIndex + 1}. Warte ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
      } else {
        console.error(` Fehler in Batch ${batchIndex + 1}:`, error.message || error);
        break;
      }
    }
    attempts++;
  }

  console.error(` Max. Versuche erreicht. Batch ${batchIndex + 1} fehlgeschlagen.`);
};

(async () => {
  try {
    const route = isGlobal
      ? Routes.applicationCommands(clientId)
      : Routes.applicationGuildCommands(clientId, guildId);

    if (action === 'deploy') {
      const commands = [];
      const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

      console.log(` Gefundene Command-Dateien: ${commandFiles.length}`, commandFiles);

      for (const file of commandFiles) {
        try {
          const command = require(`./commands/${file}`);
          if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(` ${file} geladen: ${command.data.name}`);
          } else {
            console.warn(` ${file} exportiert kein gültiges Command-Objekt.`);
          }
        } catch (err) {
          console.error(` Fehler beim Laden von ${file}:`, err);
        }
      }

      console.log(" Insgesamt zu registrierende Commands:", commands.length);
      console.log(" Ziel-Route:", route);

      // ✨ Commands in Batches aufteilen
      const batches = [];
      for (let i = 0; i < commands.length; i += BATCH_SIZE) {
        batches.push(commands.slice(i, i + BATCH_SIZE));
      }

      console.log(` Aufgeteilt in ${batches.length} Batches (je max. ${BATCH_SIZE})`);
      rest.on('rateLimited', console.log)

      for (let i = 0; i < batches.length; i++) {
        await deployBatchWithRetry(batches[i], route, i);
        if (i < batches.length - 1) {
          await sleep(2000); // 2 Sekunden
        }
      }
    }

    else if (action === 'delete') {
      await rest.put(route, { body: [] });
      console.log(` Commands erfolgreich gelöscht (${isGlobal ? "global" : "guild-spezifisch"})`);
    }

    else if (action === 'status') {
      const commands = await rest.get(route);
      console.log(` Aktive ${isGlobal ? "globale" : "guild"} Commands: ${commands.length}`);
      for (const cmd of commands) {
        console.log(`• ${cmd.name} – ${cmd.description}`);
      }
    }

    else {
      console.log(" Ungültige Aktion. Bitte verwende: deploy, delete oder status");
    }

  } catch (error) {
    console.error(" Fehler bei der Verarbeitung:", error);
    if (error.response && error.response.data) {
      console.error(' Discord-Fehlerantwort:', error.response.data);
    }
  }
})();