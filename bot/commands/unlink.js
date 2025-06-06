const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const { FOOTER, EMBED_COLOR } = require("../constants");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlink")
    .setDescription("Trenne die Verknüpfung mit deinem Bungie-Konto"),

  async execute(interaction) {
    const discordId = interaction.user.id;

    try {
      const response = await axios.delete(
        `${process.env.API_BASE_URL}/user/${discordId}`
      );

      if (response.status === 200) {
        const embed = new EmbedBuilder()
          .setTitle("Verknüpfung entfernt")
          .setDescription("Dein Bungie-Konto wurde erfolgreich getrennt.")
          .setColor(EMBED_COLOR)
          .setFooter(FOOTER);

        return interaction.reply({ embeds: [embed], ephemeral: true });
      } else if (response.status === 404) {
        return interaction.reply({
          content: "⚠️ Du hast aktuell keine Verknüpfung.",
          ephemeral: true,
        });
      } else {
        return interaction.reply({
          content: "❌ Es gab ein Problem beim Trennen deiner Verknüpfung.",
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error("Unlink-Fehler:", err.message);
      return interaction.reply({
        content: "❌ Ein Fehler ist aufgetreten.",
        ephemeral: true,
      });
    }
  },
};
