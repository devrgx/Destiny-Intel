const { SlashCommandBuilder } = require("discord.js");
const { exec } = require("child_process");
const isAdmin = require("../utils/isAdmin");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("refresh")
    .setDescription("Manually refresh emblems")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Select which data to refresh")
        .setRequired(true)
        .addChoices(
          { name: "Base (DEC)", value: "base" },
          { name: "Dynamic (emblems.report)", value: "dynamic" }
        )
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({
        content: "❌ You are not authorized to use this command.",
        ephemeral: true,
      });
    }

    const type = interaction.options.getString("type");
    const command =
      type === "base"
        ? "node scraper/scraper_dec.js && node api/utils/importEmblems.js"
        : "node scraper/scraper_es.js && node api/utils/importEmblems.js";

    await interaction.reply({
      content: `🔄 Running \`${type}\` refresh...`,
      ephemeral: true,
    });

    exec(
      command,
      { maxBuffer: 1024 * 1024 * 5 },
      async (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Error during refresh:", error.message);
          return interaction.followUp({
            content: "❌ Refresh failed:\n" + error.message,
            ephemeral: true,
          });
        }

        await interaction.followUp({
          content: "✅ Refresh complete.",
          ephemeral: true,
        });
      }
    );
  },
};
