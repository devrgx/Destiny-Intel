const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const axios = require("axios");
const { fetchFromAPI } = require("../utils/api");
const { getValidAccessToken } = require("../utils/tokenManager");
const { FOOTER } = require("../constants");
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
    .setName("check")
    .setDescription("Check if a user owns a specific emblem")
    .addStringOption((option) =>
      option
        .setName("emblem")
        .setDescription("Name of the emblem")
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Check for another user")
        .setRequired(false)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    try {
      const results = await fetchFromAPI("/emblem", "GET", { name: focused });
      if (!results || !Array.isArray(results)) return interaction.respond([]);
      return interaction.respond(
        results.slice(0, 25).map((e) => ({ name: e.name, value: e.name }))
      );
    } catch (err) {
      console.error("Autocomplete failed:", err);
      return interaction.respond([]);
    }
  },

  async execute(interaction) {
    const emblemName = interaction.options.getString("emblem");
    const targetUser = interaction.options.getUser("user") || interaction.user;

    await interaction.deferReply();

    const userData = await fetchFromAPI(`/users/${targetUser.id}`, "GET").catch(
      () => null
    );
    if (!userData || !userData.destinyMembershipId) {
      const { embed, components } = createAuthEmbed(
        targetUser,
        interaction.user
      );
      return interaction.editReply({ embeds: [embed], components });
    }

    const emblemResult = await fetchFromAPI("/emblem", "GET", {
      name: emblemName,
    }).catch(() => null);
    const emblem = Array.isArray(emblemResult) ? emblemResult[0] : null;

    if (!emblem || !emblem.collectibleHash) {
      return interaction.editReply({
        content: "❌ Emblem not found or missing `collectibleHash`.",
        ephemeral: true,
      });
    }

    let accessToken;
    try {
      accessToken = await getValidAccessToken(targetUser.id);
    } catch {
      return interaction.editReply({
        content: "❌ Could not retrieve Bungie access token. Please re-link.",
        ephemeral: true,
      });
    }

    const url = `https://www.bungie.net/Platform/Destiny2/${userData.membershipType}/Profile/${userData.destinyMembershipId}/?components=800`;

    let owned = false;
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-API-Key": process.env.BUNGIE_API_KEY,
        },
      });
      const collectibles =
        response.data.Response.profileCollectibles?.data?.collectibles || {};
      owned = collectibles[emblem.collectibleHash]?.state === 0;
    } catch {
      return interaction.editReply({
        content: "❌ Could not fetch collectibles from Bungie.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(owned ? "✅ Emblem found!" : "❌ Emblem not found!")
      .setDescription(
        `${userData.displayName || targetUser.username} ${
          owned ? "**owns**" : "**does not own**"
        } the emblem **${emblem.name}**.`
      )
      .setThumbnail(emblem.images?.[0] || null)
      .setImage(emblem.images?.[2] || null)
      .setColor(owned ? "Green" : "Red")
      .setFooter(FOOTER);

    return interaction.editReply({ embeds: [embed] });
  },
};
