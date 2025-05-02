const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const data = require("../data/data.json");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Pong!"),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: "Ping...",
      fetchReply: true,
    });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setTitle("Pong!")
      .setColor(0x0099ff)
      .addFields(
        { name: "**Latency time**", value: `${latency}ms` },
        { name: "**API latency time:**", value: `${apiLatency}ms` }
      )
      .setFooter({
        text: `Destiny Intel | v ${data.version}`,
        iconURL: "https://i.imgur.com/cVoKfFP.png",
      });

    await interaction.editReply({ content: "" , embeds: [embed] });
  },
};
