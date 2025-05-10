const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const emblemsPath = path.join(__dirname, "../data/emblems.json");
let emblems = require(emblemsPath);
const data = require("../data/data.json");

const CACHE_DURATION_HOURS = 24;

// ⏳ Speichert die aktualisierte JSON-Datei
function saveEmblems(updated) {
  fs.writeFileSync(emblemsPath, JSON.stringify(updated, null, 2));
}

// 🕒 Cache prüfen
function isCacheValid(lastUpdated) {
  if (!lastUpdated) return false;
  const diff = (Date.now() - new Date(lastUpdated).getTime()) / 1000 / 3600;
  return diff < CACHE_DURATION_HOURS;
}

// 🌐 Scraper für emblems.report
async function getEmblemReportData(emblemId) {
  const url = `https://emblems.report/emblem/${emblemId}`;
  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    let price = "error";
    let redeemed = "error";

    $("p.text-sm.text-white\\/50").each((i, el) => {
      const label = $(el).text().trim();
      const valueEl = $(el).next("p.text-right.font-mono.text-white\\/60");
      const value = valueEl.text().trim();

      if (label === "Price") price = value;
      if (label === "Redeemed") redeemed = value;
    });

    if (!price || !redeemed || price === "error" || redeemed === "error") {
      throw new Error("Required data missing");
    }

    return {
      price,
      redeemed,
      priceSource: "live",
      lastUpdated: new Date().toISOString(),
    };
  } catch (e) {
    console.error("Fehler beim Abrufen der Emblem-Daten:", e);
    return {
      price: "error",
      redeemed: "error",
      priceSource: "error",
      lastUpdated: new Date().toISOString(),
    };
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emblem")
    .setDescription("Displays info about selected Emblem!")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the Emblem:")
        .setAutocomplete(true)
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const filtered = emblems
      .filter((e) => e.name.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(
      filtered.map((e) => ({ name: e.name, value: e.id }))
    );
  },

  async execute(interaction) {
    await interaction.deferReply(); // Verzögere die Antwort

    const emblemId = interaction.options.getString("name");
    const emblem = emblems.find((e) => e.id === emblemId);

    if (!emblem) {
      return interaction.editReply({
        content: "No Emblem found with that name.",
        ephemeral: true,
      });
    }

    // Optional: Fallback für alte JSON-Dateien
    if (!("price" in emblem)) emblem.price = "unknown";
    if (!("redeemed" in emblem)) emblem.redeemed = "unknown";
    if (!("priceSource" in emblem)) emblem.priceSource = "cache";
    if (!("lastUpdated" in emblem)) emblem.lastUpdated = null;

    const needsUpdate =
      !emblem.price || !emblem.redeemed || !isCacheValid(emblem.lastUpdated);

    if (needsUpdate) {
      const updatedData = await getEmblemReportData(emblemId);
      Object.assign(emblem, updatedData);

      console.log(
        `📡 Neue Daten für Emblem ${emblem.name} (${emblem.id}) abgefragt und gespeichert.`
      );

      saveEmblems(emblems);
    }

    const embed = new EmbedBuilder()
      .setTitle(emblem.name)
      .addFields(
        { name: "**Source**", value: `${emblem.source || "_unknown_"}` },
        {
          name: "**Requirements:**",
          value: `${emblem.requirements?.join("\n") || "_unknown_"}`,
        },
        {
          name: "Links",
          value: `<:destinyemblemcollector:1368220405420003348> [DEC](https://destinyemblemcollector.com/emblem?id=${emblem.id})\n<:emblemreport:1368220407127081031> [emblems.report](https://emblems.report/emblem/${emblem.id})`,
          inline: true,
        },
        {
          name: "\u200B",
          value: `<:lightgg:1368220409039683594> [light.gg](https://www.light.gg/db/items/${emblem.id})\n<:dataexplorer:1368220403281035366> [DataExplorer](https://data.destinysets.com/i/InventoryItem:${emblem.id})`,
          inline: true,
        },
        {
          name: "\u200B",
          value: "\u200B"
        },
        {
          name: "**Price**",
          value: emblem.price,
          inline: true,
        },
        {
          name: "**Redeemed**",
          value: emblem.redeemed,
          inline: true,
        },
        {
          name: "Data source",
          value:
            emblem.priceSource === "live"
              ? `🔄 Live from emblems.report\n🕒 ${new Date(
                  emblem.lastUpdated
                ).toLocaleString()}`
              : "⚠️ Data missing\nEither an error, or the emblem does not have a price!",
        }
      )
      .setThumbnail(emblem.images[0] || "https://example.com/default.jpg")
      .setImage(emblem.images[2] || "https://example.com/default.jpg")
      .setColor(0x0099ff)
      .setFooter({
        text: `Destiny Intel | v${data.version}`,
        iconURL: "https://i.imgur.com/cVoKfFP.png",
      });

    await interaction.editReply({ embeds: [embed] });
  },
};