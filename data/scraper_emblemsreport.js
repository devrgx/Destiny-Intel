const axios = require("axios");
const cheerio = require("cheerio");

// Scraper für emblems.report
async function getEmblemReportData(emblemId) {
  const url = `https://emblems.report/emblem/${emblemId}`;
  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    let price = "error";
    let redeemed = "error";

    // Suche gezielt nach allen Label-Texten wie "Price" und "Redeemed"
    $("p.text-sm.text-white\\/50").each((i, el) => {
      const label = $(el).text().trim();
      const valueEl = $(el).next("p.text-right.font-mono.text-white\\/60");
      const value = valueEl.text().trim();

      if (label === "Price") price = value;
      if (label === "Redeemed") redeemed = value;
    });

    // Ausgabe der gefundenen Daten
    console.log(`Found Price: ${price}, Redeemed: ${redeemed}`);

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

// Testaufruf für das Emblem mit einer Beispiel-ID
const emblemId = "3961503948"; // Beispiel-ID eines Emblems
getEmblemReportData(emblemId).then((data) => {
  console.log("\nDaten für Emblem", emblemId, ":");
  console.log(data);
});