const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const emblemsPath = path.join(__dirname, "../bot/data/emblems.json");

console.log("📁 Lese emblems.json...");
let emblems;

try {
  emblems = require(emblemsPath);
  if (!Array.isArray(emblems)) throw new Error("Die JSON enthält kein Array.");
  console.log(`📦 ${emblems.length} Embleme geladen.`);
} catch (e) {
  console.error("❌ Fehler beim Laden von emblems.json:", e.message);
  process.exit(1);
}

async function getEmblemReportData(emblemId) {
  const url = `https://emblems.report/emblem/${emblemId}`;
  console.log(`🌐 Hole Daten für ${emblemId}...`);

  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    let price = null;
    let redeemed = null;

    $("p.text-sm.text-white\\/50").each((i, el) => {
      const label = $(el).text().trim().toLowerCase();
      const value = $(el).next("p").text().trim();

      if (label === "price") price = value;
      if (label === "redeemed") redeemed = value;
    });

    if (!redeemed || redeemed === "error") {
      throw new Error("Fehlender oder ungültiger Redeemed-Wert");
    }

    return {
      price: price || "N/A",
      redeemed,
      priceSource: "live",
      lastUpdated: new Date().toISOString(),
    };
  } catch (e) {
    console.error(`❌ Fehler bei ${emblemId}: ${e.message}`);
    return {
      price: "error",
      redeemed: "error",
      priceSource: "error",
      lastUpdated: new Date().toISOString(),
    };
  }
}

(async () => {
  console.log("🚀 Starte Emblem-Erweiterung...");

  for (const emblem of emblems) {
    if (!emblem?.id) {
      console.warn("⚠️ Kein ID-Feld, überspringe:", emblem?.name || "Unbekannt");
      continue;
    }

    const reportData = await getEmblemReportData(emblem.id);
    Object.assign(emblem, reportData);
    console.log(`✅ ${emblem.name} erweitert`);
  }

  fs.writeFileSync(emblemsPath, JSON.stringify(emblems, null, 2));
  console.log("💾 emblems.json gespeichert!");
})();