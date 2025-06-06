const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { fetchFromAPI } = require("../utils/api");
const { FOOTER, EMBED_COLOR } = require("../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("count")
    .setDescription(
      "Displays the amount of Emblems currently tracked by the API."
    ),

  async execute(interaction) {
    const emblems = await fetchFromAPI("/emblem");
    if (!emblems) {
      return interaction.reply({
        content: "⚠️ Could not fetch emblem data. Try again later.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("Destiny Intel")
      .setDescription(
        `There are currently **${emblems.length}** tracked Destiny 2 Emblems via the [API](https://api.d2emblem.info/emblem)!`
      )
      .setColor(EMBED_COLOR)
      .setFooter(FOOTER);

    await interaction.reply({ embeds: [embed] });
  },
};
