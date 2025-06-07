const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserBungieData, getValidAccessToken } = require("../../utils/tokenManager");
const emblems = require("../data/emblems.json");
const hashMap = require("../data/hash.json");
const axios = require("axios");
const { EMBED_COLOR, FOOTER_TEXT, FOOTER_ICON } = require("../utils/constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check")
    .setDescription("Check if you or another user owns a specific emblem.")
    .addStringOption(option =>
      option.setName("emblem")
        .setDescription("Emblem name")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User to check")
        .setRequired(false)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = emblems
      .filter(e => e.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(e => ({ name: e.name, value: e.id }));

    await interaction.respond(choices);
  },

  async execute(interaction) {
    const emblemId = interaction.options.getString("emblem");
    const targetUser = interaction.options.getUser("user") || interaction.user;

    const emblem = emblems.find(e => e.id === emblemId);
    const collectibleHash = hashMap[emblemId];

    if (!collectibleHash) {
      const embed = new EmbedBuilder()
        .setTitle(emblem?.name || "Unknown Emblem")
        .setDescription("🔒 This emblem cannot be verified via Bungie API.")
        .setColor(EMBED_COLOR)
        .setThumbnail(emblem?.images?.[1] || emblem?.images?.[0] || null)
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const bungieData = getUserBungieData(targetUser.id);
    if (!bungieData) {
      return interaction.reply({ content: "❌ User is not linked to Bungie.", ephemeral: true });
    }

    const { membershipType, membershipId } = bungieData;
    const accessToken = await getValidAccessToken(targetUser.id);

    try {
      const res = await axios.get(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=800`, {
        headers: {
          "X-API-Key": process.env.BUNGIE_API_KEY,
          Authorization: `Bearer ${accessToken}`,
        }
      });

      const state = res.data.Response.profileCollectibles?.data?.collectibles?.[collectibleHash]?.state;
      const owned = state === 0;

      const embed = new EmbedBuilder()
        .setTitle(emblem.name)
        .setColor(owned ? 0x00ff99 : 0xff5555)
        .setThumbnail(emblem.images?.[1] || emblem.images?.[0] || null)
        .setDescription(`${targetUser} ${owned ? "✅ owns" : "❌ does not own"} this emblem.`)
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON });

      return interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("❌ API error:", err.message);
      return interaction.reply({ content: "❌ API error. Try again later.", ephemeral: true });
    }
  }
};