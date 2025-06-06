const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const chalk = require("chalk");

const emblemsPath = path.join(__dirname, "../bot/data/emblems.json");

console.log(chalk.gray("📁 Loading emblems.json..."));
let emblems;

try {
  emblems = require(emblemsPath);
  if (!Array.isArray(emblems)) throw new Error("Die JSON enthält kein Array.");
  console.log(chalk.green(`📦 Loaded ${emblems.length} emblems.`));
} catch (e) {
  console.error(chalk.red("❌ Error loading emblems.json:"), e.message);
  process.exit(1);
}

async function getEmblemReportData(emblemId) {
  const url = `https://emblems.report/emblem/${emblemId}`;

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
      throw new Error("Invalid or missing redeemed value");
    }

    return {
      price: price || "N/A",
      redeemed,
      priceSource: "live",
      lastUpdated: new Date().toISOString(),
    };
  } catch (e) {
    console.error(chalk.red(`❌ [${emblemId}] Failed:`), e.message);
    return {
      price: "error",
      redeemed: "error",
      priceSource: "error",
      lastUpdated: new Date().toISOString(),
    };
  }
}

(async () => {
  let updatedCount = 0;

  for (let i = 0; i < emblems.length; i++) {
    const emblem = emblems[i];
    const newData = await getEmblemReportData(emblem.id);

    if (newData.price !== "error") {
      emblems[i] = { ...emblem, ...newData };
      console.log(chalk.blue("✏️ Updated:"), chalk.white(emblem.name));
      updatedCount++;
    } else {
      console.log(chalk.gray("⏭️ Skipped:"), chalk.white(emblem.name));
    }
  }

  fs.writeFileSync(emblemsPath, JSON.stringify(emblems, null, 2));
  console.log(chalk.green(`✅ Finished. ${updatedCount} emblems updated.`));
})();