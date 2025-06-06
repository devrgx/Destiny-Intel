const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { FOOTER, EMBED_COLOR } = require("../constants");
const { fetchFromAPI } = require("../utils/api");
const { getValidAccessToken } = require("../utils/tokenManager");
const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();

const cdnBase = "https://api.d2emblem.info/cdn/ranks";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("oldprofile")
    .setDescription("Destiny 2 account info and emblem stats")
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("Show info about your Destiny profile")
    )
    .addSubcommand((sub) =>
      sub.setName("rarest").setDescription("Show your 5 rarest emblems")
    )
    .addSubcommand((sub) =>
      sub
        .setName("rank")
        .setDescription("Show your emblem rarity and value rank")
    )
    .addSubcommand((sub) =>
      sub
        .setName("has")
        .setDescription("Check if you own a specific emblem")
        .addStringOption((option) =>
          option
            .setName("emblem")
            .setDescription("The emblem to check")
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    try {
      const results = await fetchFromAPI("/emblem", "GET", { name: focused });
      if (!results || !Array.isArray(results))
        return await interaction.respond([]);
      await interaction.respond(
        results.slice(0, 25).map((e) => ({
          name: e.name,
          value: e.name,
        }))
      );
    } catch (err) {
      console.error("Autocomplete failed:", err);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    let userData;
    try {
      userData = await fetchFromAPI(`/users/${interaction.user.id}`, "GET");
    } catch {
      userData = null;
    }

    const bungieAuthURL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${
      process.env.BUNGIE_CLIENT_ID
    }&response_type=code&redirect_uri=${encodeURIComponent(
      process.env.BUNGIE_REDIRECT_URI
    )}&state=${interaction.user.id}`;
    const authEmbed = new EmbedBuilder()
      .setTitle("❌ Not linked!")
      .setDescription(
        "You have not linked a Bungie profile yet.\nClick the button below to link your account."
      )
      .setColor(0xf54242)
      .setFooter(FOOTER);
    const authButton = new ButtonBuilder()
      .setLabel("Link with Bungie")
      .setStyle(ButtonStyle.Link)
      .setURL(bungieAuthURL);
    const authRow = new ActionRowBuilder().addComponents(authButton);

    if (!userData || !userData.destinyMembershipId) {
      return interaction.reply({
        embeds: [authEmbed],
        components: [authRow],
        ephemeral: true,
      });
    }

    const emblemsReportURL = `https://emblems.report/user/${userData.membershipType}/${userData.destinyMembershipId}`;

    if (sub === "view") {
      const expiresAt =
        userData.tokenExpires ||
        userData.tokenCreatedAt + userData.tokenExpiresIn * 1000;
      const minutesLeft = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 60000)
      );
      const embed = new EmbedBuilder()
        .setTitle("🔗 Your linked Bungie profile")
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
          },
          {
            name: "emblems.report",
            value: `[View Profile](${emblemsReportURL})`,
          }
        )
        .setFooter(FOOTER);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await interaction.deferReply();

    if (sub === "has") {
      const emblemName = interaction.options.getString("emblem");
      console.log("📥 Input emblem:", emblemName);

      // Hole Emblem-Daten von der API
      const result = await fetchFromAPI("/emblem", "GET", { name: emblemName });
      const emblem = Array.isArray(result) ? result[0] : null;

      if (!emblem || !emblem.collectibleHash) {
        return interaction.editReply({
          content: "❌ Emblem not found or missing `collectibleHash`.",
          ephemeral: true,
        });
      }

      console.log("🎯 emblem.name:", emblem.name);
      console.log("🆔 emblem.id:", emblem.id);
      console.log("🔗 collectibleHash:", emblem.collectibleHash);

      // Hole gültigen Bungie Access Token
      let accessToken;
      try {
        accessToken = await getValidAccessToken(interaction.user.id);
        console.log("🔑 Access token retrieved.");
      } catch (e) {
        console.log("❌ Access token error:", e);
        return interaction.editReply({
          content:
            "❌ Could not retrieve your Bungie access token. Please re-link.",
          ephemeral: true,
        });
      }

      // API-Request: nur Komponenten 800 (ProfileCollectibles)
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
        const hash = emblem.collectibleHash;

        console.log("📦 Checking collectibles...");
        console.log("🔢 Hash:", hash);
        console.log("🔍 Found entry:", collectibles[hash]);

        owned = collectibles[hash]?.state === 0;
      } catch (e) {
        console.log("❌ Bungie API error:", e);
        return interaction.editReply({
          content: "❌ Could not fetch your collectibles from Bungie.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(owned ? "✅ Emblem found!" : "❌ Emblem not found!")
        .setDescription(
          `You ${owned ? "**own**" : "**do not own**"} the emblem **${
            emblem.name
          }**.`
        )
        .setThumbnail(emblem.images?.[0] || null) // kleines Icon
        .setImage(emblem.images?.[2] || null) // großes Bild
        .setColor(owned ? "Green" : "Red")
        .setFooter(FOOTER);

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === "rarest") {
      const page = await axios.get(
        `https://emblems.report/user/${userData.membershipType}/${userData.destinyMembershipId}`
      );
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
            const result = await fetchFromAPI("/emblem", "GET", {
              id: emblemId,
            });
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

      return interaction.editReply({ embeds: embedArray });
    }

    if (sub === "rank") {
      try {
        const page = await axios.get(
          `https://emblems.report/user/${userData.membershipType}/${userData.destinyMembershipId}`
        );
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
        const rarityTotal = rarityDiv
          .find("p.font-light")
          .first()
          .text()
          .trim();

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
          ? `${cdnBase}/${rarityIconRel
              .split("/")
              .pop()
              .replace(".svg", ".png")}`
          : null;
        const valueIcon = valueIconRel?.endsWith(".svg")
          ? `${cdnBase}/${valueIconRel
              .split("/")
              .pop()
              .replace(".svg", ".png")}`
          : null;

        const rarityEmbed = new EmbedBuilder()
          .setTitle(`🏅 Rarity Rank: ${rarityRankName}`)
          .setColor(EMBED_COLOR)
          .addFields(
            {
              name: "Place",
              value: `${rarityPlaceRaw} of ${rarityTotal}`,
              inline: true,
            },
            { name: "Percentile", value: rarityPercent, inline: true }
          )
          .setFooter(FOOTER);
        if (rarityIcon) rarityEmbed.setThumbnail(rarityIcon);

        const valueEmbed = new EmbedBuilder()
          .setTitle(`💎 Value Rank: ${valueRankName}`)
          .setColor(EMBED_COLOR)
          .addFields(
            {
              name: "Place",
              value: `${valuePlaceRaw} of ${valueTotal}`,
              inline: true,
            },
            { name: "Percentile", value: valuePercent, inline: true }
          )
          .setFooter(FOOTER);
        if (valueIcon) valueEmbed.setThumbnail(valueIcon);

        await interaction.editReply({
          content: `[View all on emblems.report](${emblemsReportURL})`,
          embeds: [rarityEmbed, valueEmbed],
        });
      } catch {
        return interaction.editReply({
          content: "❌ Could not parse your ranks on emblems.report.",
          ephemeral: true,
        });
      }
    }
  },
};
