const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error(chalk.red("❌ Missing .env entries. Please check: DISCORD_TOKEN, CLIENT_ID, GUILD_ID"));
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

function loadCommands(dir) {
  const full = path.resolve(dir);
  if (!fs.existsSync(full)) return [];

  return fs.readdirSync(full)
    .filter(f => f.endsWith('.js'))
    .map(file => {
      const cmd = require(path.join(full, file));
      if ('data' in cmd && 'execute' in cmd) return cmd;
      console.warn(chalk.yellow(`⚠️ Invalid command in ${file}`));
      return null;
    })
    .filter(Boolean);
}

(async () => {
  const [scopeArg, modeArg] = process.argv.slice(2);

  const scope = scopeArg === 'global' ? 'global' : 'guild';
  const mode = modeArg === 'delete' ? 'delete'
              : modeArg === 'deploy' ? 'deploy'
              : 'both'; // default

  const route = scope === 'global'
    ? Routes.applicationCommands(CLIENT_ID)
    : Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);

  const commands = loadCommands('./bot/commands');
  const body = commands.map(cmd => cmd.data.toJSON());

  console.log(chalk.blue(`🧪 Mode: ${mode.toUpperCase()} | Scope: ${scope.toUpperCase()}`));

  try {
    if (mode === 'delete' || mode === 'both') {
      await rest.put(route, { body: [] });
      console.log(chalk.gray(`🧹 All ${scope.toUpperCase()} commands deleted.`));
    }

    if (mode === 'deploy' || mode === 'both') {
      const start = Date.now();
      await rest.put(route, { body });
      const time = ((Date.now() - start) / 1000).toFixed(2);
      console.log(chalk.green(`✅ Deployed ${body.length} command(s) in ${time}s to ${scope.toUpperCase()}.`));
    }
  } catch (err) {
    console.error(chalk.red(`❌ Error (${scope.toUpperCase()}):`), err);
  }
})();