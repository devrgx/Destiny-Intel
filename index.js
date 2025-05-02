require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const token = process.env.TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

// Lade alle Slash-Commands aus dem commands-Verzeichnis
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Wenn der Bot bereit ist
client.once('ready', () => {
  console.log(`${client.user.tag} ist jetzt online!`);
});

// Interaktion abfangen (z.B. wenn ein Slash-Command ausgeführt wird)
client.on('interactionCreate', async interaction => {
    const command = client.commands.get(interaction.commandName);
  
    if (!command) return;
  
    try {
      if (interaction.isCommand()) {
        await command.execute(interaction);
      } else if (interaction.isAutocomplete() && command.autocomplete) {
        await command.autocomplete(interaction);
      }
    } catch (error) {
      console.error(error);
      if (interaction.isCommand()) {
        await interaction.reply({ content: 'Es gab einen Fehler bei der Ausführung des Commands!', ephemeral: true });
      }
    }
  });

client.login(process.env.TOKEN);