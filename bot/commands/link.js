const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { FOOTER, EMBED_COLOR } = require("../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Bungie Account"),

  async execute(interaction) {
    const bungieAuthURL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${
      process.env.BUNGIE_CLIENT_ID
    }&response_type=code&redirect_uri=${encodeURIComponent(
      process.env.BUNGIE_REDIRECT_URI
    )}&state=${interaction.user.id}`;

    const embed = new EmbedBuilder()
      .setTitle("Bungie-Verknüpfung")
      .setDescription(
        "Klicke auf den Button unten, um dich mit deinem Bungie-Account zu verbinden."
      )
      .setColor(0xf5c518)
      .setFooter(FOOTER);

    const button = new ButtonBuilder()
      .setLabel("Link with Bungie")
      .setStyle(ButtonStyle.Link)
      .setURL(bungieAuthURL);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  },
};
