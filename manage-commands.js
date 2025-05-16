const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const clientId = '1367825593114038272';
const guildId = '1367601483775869048';
const token = process.env.TOKEN;

const args = process.argv.slice(2);
const action = args[0]; // deploy | delete | status
const isGlobal = args.includes('--global');

console.log("🔐 Token loaded:", token ? "✅" : "❌ NOT FOUND!");
console.log("🔧 Action:", action);
console.log("🌐 Mode:", isGlobal ? "🌍 Global Mode" : "🧪 Dev Mode (Guild)");

const rest = new REST({ version: '10' }).setToken(token);
rest.on('rateLimited', console.log);

// 🔹 Funktion zum Laden von Commands aus einem Ordner
const loadCommandsFromDir = (dir) => {
  const commands = [];
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Directory "${dir}" does not exist.`);
    return commands;
  }

  const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
  console.log(`📦 Found ${commandFiles.length} command files in "${dir}"`, commandFiles);

  for (const file of commandFiles) {
    try {
      const command = require(`${dir}/${file}`);
      if ('data' in command && 'execute' in command) {
        commands.push(command);
        console.log(`✅ Loaded command: ${command.data.name}`);
      } else {
        console.warn(`⚠️ ${file} does not export a valid command object.`);
      }
    } catch (err) {
      console.error(`❌ Error loading ${file}:`, err);
    }
  }

  return commands;
};

(async () => {
  try {
    const route = isGlobal
      ? Routes.applicationCommands(clientId)
      : Routes.applicationGuildCommands(clientId, guildId);

    if (action === 'deploy') {
      const commandDir = isGlobal ? './commands' : './test_commands';
      const commands = loadCommandsFromDir(commandDir);

      console.log("📋 Total commands to deploy:", commands.length);
      console.log("📍 Target route:", route);

      console.log("🚀 Deploying all commands at once...");
      const result = await rest.put(route, {
        body: commands.map(cmd => cmd.data.toJSON()),
      });
      console.log(`✅ Successfully deployed ${result.length} commands.`);

    } else if (action === 'delete') {
      await rest.put(route, { body: [] });
      console.log(`🗑️ Successfully deleted all ${isGlobal ? "global" : "guild"} commands`);
    } else if (action === 'status') {
      const commands = await rest.get(route);
      console.log(`🔍 Active ${isGlobal ? "global" : "guild"} commands: ${commands.length}`);
      for (const cmd of commands) {
        console.log(`• ${cmd.name} – ${cmd.description}`);
      }
    } else {
      console.log("❌ Invalid action. Please use: deploy, delete, or status");
    }

  } catch (error) {
    console.error("❌ Error processing:", error);
    if (error.response && error.response.data) {
      console.error('📨 Discord error response:', error.response.data);
    }
  }
})();