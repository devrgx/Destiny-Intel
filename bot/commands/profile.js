const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { FOOTER, EMBED_COLOR } = require("../constants");
const { fetchFromAPI } = require("../utils/api");
const isAdmin = require("../utils/isAdmin");
require("dotenv").config();

function createAuthEmbed(targetUser, interactionUser) {
  const isSelf = targetUser.id === interactionUser.id;

  const bungieAuthURL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${
    process.env.BUNGIE_CLIENT_ID
  }&response_type=code&redirect_uri=${encodeURIComponent(
    process.env.BUNGIE_REDIRECT_URI
  )}&state=${targetUser.id}`;

  const embed = new EmbedBuilder()
    .setTitle("❌ Not linked!")
    .setDescription(
      isSelf
        ? "You have not linked a Bungie profile yet.\nClick the button below to link your account."
        : `**${targetUser.username}** has not linked a Bungie profile.`
    )
    .setColor(0xf54242)
    .setFooter(FOOTER);

  const components = isSelf
    ? [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Link with Bungie")
            .setStyle(ButtonStyle.Link)
            .setURL(bungieAuthURL)
        ),
      ]
    : [];

  return { embed, components };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Show Destiny profile info")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Target Discord user")
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user") || interaction.user;

    if (
      targetUser.id !== interaction.user.id &&
      !isAdmin(interaction.user.id)
    ) {
      return interaction.reply({
        content: "❌ Only administrators can view other users' profiles.",
        ephemeral: true,
      });
    }

    let userData;
    try {
      userData = await fetchFromAPI(`/users/${targetUser.id}`, "GET");
    } catch {
      userData = null;
    }

    if (!userData || !userData.destinyMembershipId) {
      const { embed, components } = createAuthEmbed(
        targetUser,
        interaction.user
      );
      return interaction.reply({
        embeds: [embed],
        components,
        ephemeral: true,
      });
    }

    const emblemsReportURL = `https://emblems.report/user/${userData.membershipType}/${userData.destinyMembershipId}`;
    const expiresAt =
      userData.tokenExpires ||
      userData.tokenCreatedAt + userData.tokenExpiresIn * 1000;
    const minutesLeft = Math.max(
      0,
      Math.floor((expiresAt - Date.now()) / 60000)
    );

    const embed = new EmbedBuilder()
      .setTitle(`🔗 Bungie profile for ${targetUser.username}`)
      .setColor(EMBED_COLOR)
      .addFields(
        {
          name: "Display Name",
          value: userData.displayName || "Unknown",
          inline: true,
        },
        {
          name: "Membership ID",
          value: userData.destinyMembershipId,
          inline: true,
        },
        {
          name: "Token valid for",
          value: `${minutesLeft} minutes`,
          inline: true,
        } /*,
        { name: "emblems.report", value: `[View Profile](${emblemsReportURL})` }*/
      )
      .setFooter(FOOTER);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
