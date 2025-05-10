const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const clientId = '1367825593114038272';
const guildId = '1367601483775869048';
const token = process.env.TOKEN;

const args = process.argv.slice(2);
const action = args[0]; // deploy | delete | status
const isGlobal = args.includes('--global');
const sequential = args.includes('--sequential');

const SLEEP_DURATION = 5000;

console.log("Token loaded:", token ? "✅" : "❌ NOT FOUND!");
console.log("Action:", action);
console.log("Mode:", isGlobal ? "Global" : "Guild");
console.log("Deploy method:", sequential ? "Sequential (slow)" : "Batch (fast)");

const rest = new REST({ version: '10' }).setToken(token);
rest.on('rateLimited', console.log);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// 🔹 Funktion zum Laden von Commands aus einem Ordner
const loadCommandsFromDir = (dir) => {
  const commands = [];
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Directory "${dir}" does not exist.`);
    return commands;
  }

  const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
  console.log(`Found command files in "${dir}": ${commandFiles.length}`, commandFiles);

  for (const file of commandFiles) {
    try {
      const command = require(`${dir}/${file}`);
      if ('data' in command && 'execute' in command) {
        commands.push(command);
        console.log(`✅ Loaded command: ${command.data.name}`);
      } else {
        console.warn(`⚠️ ${file} in "${dir}" does not export a valid command object.`);
      }
    } catch (err) {
      console.error(`❌ Error loading ${file} in "${dir}":`, err);
    }
  }

  return commands;
};

const deployCommand = async (command, route) => {
  try {
    console.log(`Deploying command: ${command.data.name}...`);
    const result = await rest.put(route, { body: [command.data.toJSON()] });
    console.log(`✅ Command "${command.data.name}" deployed successfully.`);
    await sleep(SLEEP_DURATION);
  } catch (error) {
    console.error(`❌ Failed to deploy command "${command.data.name}":`, error.message || error);
  }
};

(async () => {
  try {
    const route = isGlobal
      ? Routes.applicationCommands(clientId)
      : Routes.applicationGuildCommands(clientId, guildId);

    if (action === 'deploy') {
      let commands = loadCommandsFromDir('./commands');

      // 🔸 Nur im Guild-Modus auch test_commands laden
      if (!isGlobal) {
        commands = commands.concat(loadCommandsFromDir('./test_commands'));
      }

      console.log("Total commands to deploy:", commands.length);
      console.log("Target route:", route);

      if (sequential) {
        console.log("Deploying commands sequentially (with delay)...");
        for (const command of commands) {
          await deployCommand(command, route);
        }
      } else {
        console.log("Deploying all commands at once...");
        const result = await rest.put(route, {
          body: commands.map(cmd => cmd.data.toJSON()),
        });
        console.log(`✅ Successfully deployed ${result.length} commands.`);
      }

    } else if (action === 'delete') {
      await rest.put(route, { body: [] });
      console.log(`✅ Successfully deleted all ${isGlobal ? "global" : "guild"} commands`);
    } else if (action === 'status') {
      const commands = await rest.get(route);
      console.log(`Active ${isGlobal ? "global" : "guild"} commands: ${commands.length}`);
      for (const cmd of commands) {
        console.log(`• ${cmd.name} – ${cmd.description}`);
      }
    } else {
      console.log("❌ Invalid action. Please use: deploy, delete, or status");
    }

  } catch (error) {
    console.error("❌ Error processing:", error);
    if (error.response && error.response.data) {
      console.error('Discord error response:', error.response.data);
    }
  }
})();