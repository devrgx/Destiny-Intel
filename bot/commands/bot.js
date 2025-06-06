const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { FOOTER, EMBED_COLOR } = require("../constants");

const BOT_VERSION = process.env.BOT_VERSION || "unknown";
const INVITE_URL =
  "https://discord.com/oauth2/authorize?client_id=1367825593114038272&permissions=139586825408&integration_type=0&scope=bot+applications.commands";
const SUPPORT_URL = "https://discord.gg/wgSFPBuRhF";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bot")
    .setDescription("Bot related options (Invite or Support Server)")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Select an option:")
        .setRequired(true)
        .addChoices(
          { name: "Invite the Bot", value: "invite" },
          { name: "Join the Support Server", value: "join" }
        )
    ),

  async execute(interaction) {
    const choice = interaction.options.getString("category");

    const embed = new EmbedBuilder().setColor(EMBED_COLOR).setFooter(FOOTER);

    if (choice === "invite") {
      embed
        .setTitle("Invite the Bot")
        .setURL(INVITE_URL)
        .setDescription(
          `You can add the bot to your own server by clicking [here](${INVITE_URL}).`
        );
    } else if (choice === "join") {
      embed
        .setTitle("Join the Support Server")
        .setURL(SUPPORT_URL)
        .setDescription(
          `You can join the bot's support server by clicking [here](${SUPPORT_URL}).`
        );
    }

    await interaction.reply({ embeds: [embed] });
  },
};
