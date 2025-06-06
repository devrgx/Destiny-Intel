const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { fetchFromAPI } = require("../utils/api");
const { FOOTER, EMBED_COLOR } = require("../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emblem")
    .setDescription("Shows information about a Destiny 2 Emblem.")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the emblem")
        .setAutocomplete(true)
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    try {
      const results = await fetchFromAPI("/emblem", "GET", { name: focused });

      if (!results || !Array.isArray(results)) return interaction.respond([]);

      await interaction.respond(
        results.slice(0, 25).map((e) => ({
          name: e.name,
          value: e.name,
        }))
      );
    } catch (err) {
      console.error("❌ Autocomplete failed:", err);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    await interaction.deferReply();
    const emblemName = interaction.options.getString("name");

    let emblem;
    try {
      const resultList = await fetchFromAPI("/emblem", "GET", {
        name: emblemName,
      });
      emblem = Array.isArray(resultList) ? resultList[0] : null;
    } catch (err) {
      console.error("Failed to fetch emblem:", err);
    }

    if (!emblem || emblem.error) {
      return interaction.editReply({
        content: "❌ No emblem found with that name, or an error occurred.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(emblem.name || "Unknown Emblem")
      .setThumbnail(emblem.images?.[0] || null)
      .setImage(emblem.images?.[2] || null)
      .addFields(
        { name: "Source", value: emblem.source || "_unknown_" },
        {
          name: "Requirements",
          value: emblem.requirements?.join("\n") || "_unknown_",
        },
        { name: "Available?", value: emblem.available ? "✅" : "❌" },
        {
          name: "Links",
          value:
            `<:destinyemblemcollector:1368220405420003348> [DEC](https://destinyemblemcollector.com/emblem?id=${emblem.id})\n` +
            /*`<:emblemsreport:1371211171935289458> [emblems.report](https://emblems.report/emblem/${emblem.id})\n` +*/
            `<:lightgg:1368220409039683594> [light.gg](https://www.light.gg/db/items/${emblem.id})\n` +
            `<:dataexplorer:1368220403281035366> [DataExplorer](https://data.destinysets.com/i/InventoryItem:${emblem.id})`,
        },
        /*{
          name: "Market Value",
          value: emblem.price && emblem.price !== "N/A" ? emblem.price : "🔻 No Price Available",
          inline: true,
        },*/
        {
          name: "Redeemed",
          value: emblem.redeemed || "unknown",
          inline: true,
        },
        {
          name: "Data Source",
          value: `📡 ${emblem.priceSource || "unknown"}\n🕒 ${
            emblem.lastUpdated
              ? new Date(emblem.lastUpdated).toLocaleString()
              : "unknown"
          }`,
        }
      )
      .setColor(EMBED_COLOR)
      .setFooter(FOOTER);

    await interaction.editReply({ embeds: [embed] });
  },
};
