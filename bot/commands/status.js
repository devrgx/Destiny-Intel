const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { fetchFromAPI } = require("../utils/api");
const { FOOTER, EMBED_COLOR, ADMIN_USER_ID } = require("../constants");
require("dotenv").config();
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("[ADMIN] Check or manage a user.")
    .addUserOption((option) =>
      option
        .setName("player")
        .setDescription("User mention or ID")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Was soll passieren?")
        .addChoices({ name: "remove linking", value: "unlink" })
    ),

  async execute(interaction) {
    if (interaction.user.id !== ADMIN_USER_ID) {
      return interaction.reply({
        content: "❌ Du bist nicht autorisiert, diesen Befehl zu verwenden.",
        ephemeral: true,
      });
    }

    const player = interaction.options.getUser("player");
    const action = interaction.options.getString("action");

    if (action === "unlink") {
      try {
        await axios.delete(`${process.env.API_BASE_URL}/user/${player.id}`);
        return interaction.reply({
          content: `✅ Verknüpfung für <@${player.id}> wurde entfernt.`,
          ephemeral: true,
        });
      } catch (err) {
        return interaction.reply({
          content: "❌ Fehler beim Entfernen.",
          ephemeral: true,
        });
      }
    }

    try {
      const data = await fetchFromAPI("/bungie/data", "GET", {
        discordId: player.id,
      });

      if (!data || !data.Response) {
        return interaction.reply({
          content: `❌ Keine verknüpften Daten für <@${player.id}> gefunden.`,
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`Link-Status: ${player.username}`)
        .setDescription("Verknüpfte Daten aus Bungie API:")
        .setColor(EMBED_COLOR)
        .addFields({
          name: "Membership ID",
          value: String(data.Response.profile.data.userInfo.membershipId),
        })
        .setFooter(FOOTER);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error("Status-Fetch-Error:", err.message);
      return interaction.reply({
        content: "❌ Fehler beim Abrufen der Daten.",
        ephemeral: true,
      });
    }
  },
};
