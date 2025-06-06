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
    .setName("rarest")
    .setDescription("Show the 5 rarest emblems")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Show emblems of another user")
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
    let page;
    try {
      page = await axios.get(emblemsReportURL);
    } catch (e) {
      return interaction.editReply({
        content: "❌ Could not fetch emblems.report page.",
        ephemeral: true,
      });
    }

    const $ = cheerio.load(page.data);
    const emblemCards = $(".relative.z-10.p-0\\.5").toArray().slice(0, 5);

    if (emblemCards.length === 0) {
      return interaction.editReply({
        content: "No emblems found on emblems.report!",
        ephemeral: true,
      });
    }

    const embedArray = [];

    for (const [i, el] of emblemCards.entries()) {
      const href = $(el).find("a").attr("href") || "";
      const match = href.match(/\/emblem\/(\d+)/);
      const emblemId = match ? match[1] : null;
      const redeemedText = $(el)
        .find("p")
        .filter((j, elem) => $(elem).text().includes("Redeemed"))
        .text()
        .trim();

      let emblemObj = null;
      if (emblemId) {
        try {
          const result = await fetchFromAPI("/emblem", "GET", { id: emblemId });
          emblemObj = Array.isArray(result) ? result[0] : null;
        } catch {}
      }

      const fields = [];
      if (redeemedText)
        fields.push({
          name: "Redeemed",
          value: redeemedText.replace(" Redeemed", ""),
          inline: true,
        });
      if (emblemObj?.price)
        fields.push({ name: "Price", value: emblemObj.price, inline: true });

      const embed = new EmbedBuilder()
        .setTitle(`🌟 #${i + 1} ${emblemObj?.name || `Emblem ${emblemId}`}`)
        .setColor(EMBED_COLOR)
        .addFields(fields)
        .setFooter(FOOTER);

      if (emblemObj?.images?.[0]) embed.setThumbnail(emblemObj.images[0]);
      if (emblemObj?.images?.[2]) embed.setImage(emblemObj.images[2]);

      embedArray.push(embed);
    }

    return interaction.editReply({
      /*content: `[View on emblems.report](${emblemsReportURL})`,*/ embeds:
        embedArray,
    });
  },
};
