const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const data = require("../data/data.json");

const usersFilePath = path.join(__dirname, "../data/users.json");

function loadUsers() {
  if (!fs.existsSync(usersFilePath)) return {};
  return JSON.parse(fs.readFileSync(usersFilePath));
}

function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlink")
    .setDescription("Trenne die Verknüpfung mit deinem Bungie-Konto"),

  async execute(interaction) {
    const users = loadUsers();

    if (users[interaction.user.id]) {
      delete users[interaction.user.id];
      saveUsers(users);

      const embed = new EmbedBuilder()
        .setTitle("Verknüpfung entfernt")
        .setDescription("Dein Bungie-Konto wurde erfolgreich getrennt.")
        .setColor(0xff6600)
        .setFooter({
          text: `Destiny Intel | v ${data.version}`,
          iconURL: "https://i.imgur.com/cVoKfFP.png",
        });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({
        content: "Du hast kein verknüpftes Konto.",
        ephemeral: true,
      });
    }
  },
};
