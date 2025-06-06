const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const { FOOTER, EMBED_COLOR } = require("../constants");
const { fetchFromAPI } = require("../utils/api");
require("dotenv").config();

const cdnBase = "https://api.d2emblem.info/cdn/ranks";

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
    .setName("rank")
    .setDescription("Show your emblem rarity and value rank")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Show ranks of another user")
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user") || interaction.user;

    await interaction.deferReply();

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
      return interaction.editReply({ embeds: [embed], components });
    }

    const emblemsReportURL = `https://emblems.report/user/${userData.membershipType}/${userData.destinyMembershipId}`;

    try {
      const page = await axios.get(emblemsReportURL);
      const $ = cheerio.load(page.data);

      const rarityDiv = $(".flex.text-white\\/75").first();
      const valueDiv = $(".flex.text-white\\/75").eq(1);

      const rarityRankName =
        rarityDiv.find("p.text-3xl").text().trim() || "Unknown";
      const valueRankName =
        valueDiv.find("p.text-3xl").text().trim() || "Unknown";

      const rarityPlaceRaw = rarityDiv.find("p.font-extrabold").text().trim();
      const rarityPercent = rarityDiv
        .find("p.text-lg.font-light")
        .last()
        .text()
        .trim();
      const rarityTotal = rarityDiv.find("p.font-light").first().text().trim();

      const valuePlaceRaw = valueDiv.find("p.font-extrabold").text().trim();
      const valuePercent = valueDiv
        .find("p.text-lg.font-light")
        .last()
        .text()
        .trim();
      const valueTotal = valueDiv.find("p.font-light").first().text().trim();

      const rarityIconRel = rarityDiv.find("img").first().attr("src");
      const valueIconRel = valueDiv.find("img").first().attr("src");

      const rarityIcon = rarityIconRel?.endsWith(".svg")
        ? `${cdnBase}/${rarityIconRel.split("/").pop().replace(".svg", ".png")}`
        : null;
      const valueIcon = valueIconRel?.endsWith(".svg")
        ? `${cdnBase}/${valueIconRel.split("/").pop().replace(".svg", ".png")}`
        : null;

      const rarityEmbed = new EmbedBuilder()
        .setTitle(`🏅 Rarity Rank: ${rarityRankName}`)
        .setColor(EMBED_COLOR)
        .addFields(
          { name: "Place", value: `${rarityPlaceRaw}`, inline: true },
          { name: "Percentile", value: rarityPercent, inline: true }
        )
        .setFooter(FOOTER);
      if (rarityIcon) rarityEmbed.setThumbnail(rarityIcon);

      const valueEmbed = new EmbedBuilder()
        .setTitle(`💎 Value Rank: ${valueRankName}`)
        .setColor(EMBED_COLOR)
        .addFields(
          { name: "Place", value: `${valuePlaceRaw}`, inline: true },
          { name: "Value (est.)", value: valuePercent, inline: true }
        )
        .setFooter(FOOTER);
      if (valueIcon) valueEmbed.setThumbnail(valueIcon);

      await interaction.editReply({
        /*content: `[View on emblems.report](${emblemsReportURL})`, */ embeds: [
          rarityEmbed /*, valueEmbed*/,
        ],
      });
    } catch {
      return interaction.editReply({
        content: "❌ Could not parse your ranks.",
        ephemeral: true,
      });
    }
  },
};
