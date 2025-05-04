const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const data = require("../data/data.json");

// Pfad zur users.json
const usersFilePath = path.join(__dirname, "../data/users.json");

// Deine Admin-User-ID (du kannst auch aus einer .env-Datei oder einer anderen Quelle laden)
const ADMIN_USER_ID = "330992301558202378"; // Ersetze dies mit deiner Discord-ID

// Funktion, um alle verknüpften Benutzer zu laden
function loadUsers() {
  if (!fs.existsSync(usersFilePath)) return {};
  return JSON.parse(fs.readFileSync(usersFilePath));
}

// Funktion, um einen Benutzer zu löschen (Verknüpfung entfernen)
function unlinkUser(discordId) {
  const users = loadUsers();

  if (users[discordId]) {
    delete users[discordId]; // Löscht den Benutzer
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2)); // Speichert die aktualisierte Datei
    return true;
  }
  return false;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("[ADMIN] Checks the status of user.")
    .addUserOption((option) =>
      option
        .setName("player")
        .setDescription("DiscordID or @mention of user.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Unlink the user.")
        .setRequired(false)
        .addChoices({ name: "remove linking", value: "unlink" })
    ),

  async execute(interaction) {
    const player = interaction.options.getUser("player"); // Das User-Objekt aus der Erwähnung oder ID
    const action = interaction.options.getString("action"); // Die gewählte Aktion (optional)
    const discordId = player.id; // Die ID des Users
    const users = loadUsers();

    // Überprüfen, ob der Benutzer der Admin ist
    if (interaction.user.id !== ADMIN_USER_ID) {
      return interaction.reply({
        content: "You are not the Admin of the Bot, sorry!.",
        ephemeral: true,
      });
    }

    // Wenn keine Aktion angegeben wurde, den Status des Spielers anzeigen
    if (!action) {
      // Spielerstatus anzeigen
      if (users[discordId]) {
        const userData = users[discordId];
        const displayName = userData.displayName || "unknown/undefined"; // Wenn kein Display-Name vorhanden, 'Unbekannt' anzeigen
        const membershipId =
          userData.destinyMembershipId || "unknown/undefined"; // Wenn kein Display-Name vorhanden, 'Unbekannt' anzeigen

        const embed = new EmbedBuilder()
          .setTitle("Linking Status")
          .setDescription(
            `User ${player.username} is linked with a valid Bungie account.`
          )
          .addFields(
            { name: "Name", value: displayName, inline: true },
            { name: `\u200B`, value: membershipId, inline: true }
          )
          .setColor(0x0099ff)
          .setFooter({
            text: `Destiny Intel | v ${data.version}`,
            iconURL: "https://i.imgur.com/cVoKfFP.png",
          });

        return interaction.reply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setTitle("Linking status")
          .setDescription(`User ${player.username} is not linked yet.`)
          .setColor(0xff0000)
          .setFooter({
            text: `Destiny Intel | v ${data.version}`,
            iconURL: "https://i.imgur.com/cVoKfFP.png",
          });

        return interaction.reply({ embeds: [embed] });
      }
    }

    // Wenn 'unlink' angegeben ist, die Verknüpfung aufheben
    if (action === "unlink") {
      const success = unlinkUser(discordId);
      if (success) {
        const embed = new EmbedBuilder()
          .setTitle("Removed: linking")
          .setDescription(`Link for user ${player.username} is now removed.`)
          .setColor(0xff0000)
          .setFooter({
            text: `Destiny Intel | v ${data.version}`,
            iconURL: "https://i.imgur.com/cVoKfFP.png",
          });

        return interaction.reply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription(
            `No link was found for ${player.username}! Use \`/link\`! .`
          )
          .setColor(0xff0000)
          .setFooter({
            text: `Destiny Intel | v ${data.version}`,
            iconURL: "https://i.imgur.com/cVoKfFP.png",
          });

        return interaction.reply({ embeds: [embed] });
      }
    }

    // Falls keine der Bedingungen zutrifft, eine Fehlermeldung zurückgeben (obwohl das nicht passieren sollte)
    return interaction.reply({
      content: "Error.",
      ephemeral: true,
    });
  },
};
