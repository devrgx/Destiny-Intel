const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { FOOTER, EMBED_COLOR } = require("../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("icon")
    .setDescription("Displays the Bot icon!"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Icon")
      .setImage("https://i.imgur.com/cVoKfFP.png")
      .setColor(EMBED_COLOR)
      .setFooter(FOOTER);

    await interaction.reply({ content: "test", embeds: [embed] });
  },
};
