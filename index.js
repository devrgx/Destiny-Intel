require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const data = require("./data/data.json")

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
const commandFolders = ['./commands', './test_commands'];
// Dynamisch alle Command-Dateien laden
//const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
client.commands = new Collection();

// Dynamisch alle Command-Dateien laden, auch aus /testcommands
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(folder).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`${folder}/${file}`);
    console.log(`Lade Command: ${command.data.name}`);  // Überprüfe, ob der neue Command auch geladen wird

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    }
  }
}
/*for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[WARN] Die Datei ${file} exportiert keinen gültigen Slash-Command.`);
  }
}*/

// Wenn der Bot bereit ist
client.once('ready', () => {
  console.log(`${client.user.tag} ist jetzt online!`);
});

// Event-Handler für Slash-Commands und Autocomplete
client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Error while executing command. Try again later or report to Dev.', ephemeral: true });
    }
  } else if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command && typeof command.autocomplete === 'function') {
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error('Fehler bei Autocomplete:', error);
      }
    }
  }
});


client.on('guildCreate', async guild => {
  console.log(`Bot got added to: ${guild.name} (${guild.id})`);
  
  try {
    // Versuche, die Audit Logs für Bot-Invites zu lesen
    const auditLogs = await guild.fetchAuditLogs({ type: 28, limit: 1 }); // 28 = BOT_ADD
    const entry = auditLogs.entries.first();

    if (entry && entry.target.id === client.user.id) {
      const inviter = entry.executor;

      // Sende eine DM an den Einlader
      const user = await guild.client.users.fetch(inviter.id);

      const embed = new EmbedBuilder()
        .setTitle("Emblem Intel")
        .setDescription(`Thanks for inviting **${client.user.tag}** to **${guild.name}**.\n\nIf you find any issues, need help or want to discuss new features, consider joining our [Server](https://discord.gg/wgSFPBuRhF), you can create a new invite, or join the support Server with the \`/bot\` subcommand.\n\nAll data is provided by multiple people, including DestinyEmblemCollector. You can check out his project (and other people who contributed) with \`/credits\`.`)
        .setColor(0x0099ff)
        .setFooter({
          text: `Destiny Intel | v ${data.version}`,
          iconURL: "https://i.imgur.com/cVoKfFP.png",
        });
      await user.send({ embeds: [embed]});

      console.log(`From: ${inviter.tag}`);
    }
  } catch (error) {
    console.error('Error while trying to join server:', error);
  }
});


client.login(process.env.TOKEN);