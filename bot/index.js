const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// 🔄 Lade alle Command-Dateien
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`⚠️ Invalid command file: ${file}`);
  }
}

// ✅ Ready-Event
client.once("ready", async () => {
  console.log(`✅ Bot online as ${client.user.tag}`);

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected (bot)");
  } catch (err) {
    console.error("❌ MongoDB connection failed (bot):", err.message);
  }
});

// 📥 Interaktion-Handler
client.on("interactionCreate", async (interaction) => {
  console.log(`📥 Incoming interaction: ${interaction.type} | ${interaction.commandName || 'n/a'}`);

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`⚠️ Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    if (interaction.isChatInputCommand()) {
      await command.execute(interaction);
    } else if (interaction.isAutocomplete()) {
      if (command.autocomplete) {
        await command.autocomplete(interaction);
      }
    }
  } catch (error) {
    console.error(`❌ Error in command ${interaction.commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "❌ Something went wrong!", ephemeral: true });
    } else {
      await interaction.reply({ content: "❌ Error executing command.", ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);