const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const data = require("../data/data.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("icon")
    .setDescription("Displays the Bot icon!"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Icon")
      .setImage("https://i.imgur.com/cVoKfFP.png")
      .setColor(0x0099ff)
      .setFooter({
        text: `Destiny Intel | v ${data.version}`,
        iconURL: "https://i.imgur.com/cVoKfFP.png",
      });

    await interaction.reply({ content: "test", embeds: [embed] });
  },
};
