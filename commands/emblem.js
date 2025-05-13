const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const emblemsPath = path.join(__dirname, "../data/emblems.json");
let emblems = require(emblemsPath);
const data = require("../data/data.json");

const CACHE_DURATION_HOURS = 6;

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
  //const url = `https://emblems.report/emblem/${emblemId}`;
  const url = `https://emblems.report/emblem/${emblemId}`;

  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    let price = null;
    let redeemed = null;

    $("p.text-sm.text-white\\/50").each((i, el) => {
      const label = $(el).text().trim();
      const valueEl = $(el).next("p.text-right.font-mono.text-white\\/60");
      const value = valueEl.text().trim();

      if (label === "Price") price = value;
      if (label === "Redeemed") redeemed = value;
    });

    if (!redeemed || redeemed === "error") {
      throw new Error("Required data missing: redeemed");
    }

    const hasValidPrice = !!price && price !== "N/A";

    return {
      price: price || "N/A",
      redeemed,
      priceSource: "live", // Immer "live", wenn kein Fehler geworfen wurde
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
    )
    .addBooleanOption((option) =>
      option
        .setName("force-update")
        .setDescription("Force update of emblem data (overrides cache)")
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
    const forceUpdate = interaction.options.getBoolean("force-update") || false;

    const emblemId = interaction.options.getString("name");
    const emblem = emblems.find((e) => e.id === emblemId);

    if (!emblem) {
      return interaction.editReply({
        content: "No Emblem found with that name.",
        ephemeral: true,
      });
    }

    // Optional: Fallback & Migration für alte JSON-Daten
    if (!("price" in emblem) || emblem.price === "unknown")
      emblem.price = "N/A";
    if (!("redeemed" in emblem) || emblem.redeemed === "unknown")
      emblem.redeemed = "error";
    if (!("priceSource" in emblem)) emblem.priceSource = "cache";
    if (!("lastUpdated" in emblem)) emblem.lastUpdated = null;

    const needsUpdate =
      forceUpdate ||
      emblem.price === "error" ||
      emblem.redeemed === "error" ||
      !isCacheValid(emblem.lastUpdated);

    if (needsUpdate) {
      const updatedData = await getEmblemReportData(emblemId);
      Object.assign(emblem, updatedData);

      console.log(
        `📡 Neue Daten für Emblem ${emblem.name} (${emblem.id}) abgefragt und gespeichert.`
      );
      console.log("Aktualisierte Emblem-Daten:", emblem);

      saveEmblems(emblems);
    }

    const embed = new EmbedBuilder()
      .setTitle(emblem.name)
      .addFields(
        { name: "Source",
          value: `${emblem.source || "_unknown_"}` },
        {
          name: "Requirements",
          value: `${emblem.requirements?.join("\n") || "_unknown_"}`,
        },
        {
          name: "Available?",
          value: emblem.available ? "✅" : "❌",
          inline: false,
        },
        {
          name: "Links",
          value: `<:destinyemblemcollector:1368220405420003348> [DEC](https://destinyemblemcollector.com/emblem?id=${emblem.id})\n<:emblemsreport:1371211171935289458> [emblems.report](https://emblems.report/emblem/${emblem.id})\n<:lightgg:1368220409039683594> [light.gg](https://www.light.gg/db/items/${emblem.id})\n<:dataexplorer:1368220403281035366> [DataExplorer](https://data.destinysets.com/i/InventoryItem:${emblem.id})`,
          inline: true,
        },
        {
          name: "\u200B",
          value: "\u200B",
          inline: false,
        },
        {
          name: "Market Value",
          value:
            emblem.price && emblem.price !== "N/A"
              ? emblem.price
              : "🔻 No Price Available",
              inline: true,
        },
        {
          name: "Redeemed",
          value: emblem.redeemed,
          inline: true,
        },
        {
          name: "Data source",
          value: (() => {
            if (emblem.price && emblem.price !== "N/A") {
              // Preis vorhanden und live
              return `🔄 Live from emblems.report\n🕒 ${new Date(
                emblem.lastUpdated
              ).toLocaleString()}`;
            } else if (emblem.priceSource === "live") {
              // Preis nicht vorhanden und live
              return `🔄 Live from emblems.report\n🕒 ${new Date(
                emblem.lastUpdated
              ).toLocaleString()}\n⚠️ This emblem does not have a price (yet) or is universal!`;
            } else if (emblem.price && emblem.price !== "N/A") {
              // Preis vorhanden und aus dem Cache
              return `⚠️ Data from cache\n🕒 ${new Date(
                emblem.lastUpdated
              ).toLocaleString()}`;
            } else {
              // Preis nicht vorhanden und aus dem Cache
              return `⚠️ Data from cache\n🕒 ${new Date(
                emblem.lastUpdated
              ).toLocaleString()}\n⚠️ This emblem does not have a price (yet) or is universal!`;
            }
          })(),
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
