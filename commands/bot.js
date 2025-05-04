//https://discord.com/oauth2/authorize?client_id=1367825593114038272&permissions=964220546240&integration_type=0&scope=bot

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const data = require("../data/data.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bot")
    .setDescription("Displays some bot stuff")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("What do you want to do with the Bot?")
        .setRequired(true)
        .addChoices(
          { name: "Invite the Bot!", value: "invite" },
          { name: "Join the Bots server!", value: "join" }
        )
    ),

  async execute(interaction) {
    const invite = new EmbedBuilder()
      .setTitle("Invite the Bot")
      .setURL(
        "https://discord.com/oauth2/authorize?client_id=1367825593114038272&permissions=964220546240&integration_type=0&scope=bot"
      )
      .setDescription(
        "You can add the Bot to your own Server, just click [here](https://discord.com/oauth2/authorize?client_id=1367825593114038272&permissions=964220546240&integration_type=0&scope=bot)."
      )
      .setColor(0x0099ff)
      .setFooter({
        text: `Destiny Intel | v ${data.version}`,
        iconURL: "https://i.imgur.com/cVoKfFP.png",
      });

    const join = new EmbedBuilder()
      .setTitle("Join the Bots server")
      .setURL("https://discord.gg/wgSFPBuRhF")
      .setDescription(
        "You can join the Bots support Server by clicking [here](https://discord.gg/wgSFPBuRhF)."
      )
      .setColor(0x0099ff)
      .setFooter({
        text: `Destiny Intel | v ${data.version}`,
        iconURL: "https://i.imgur.com/cVoKfFP.png",
      });

    if (interaction.options.getString("category") === "join") {
      await interaction.reply({ embeds: [join] });
    }

    if (interaction.options.getString("category") === "invite") {
      await interaction.reply({ embeds: [invite] });
    }
  },
};
