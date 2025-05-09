const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const emblempath = require("./emblems.json");
const BASE_URL = "https://destinyemblemcollector.com";

if (emblempath) {
  console.log("OK");
}

async function getEmblemList() {
  const res = await axios.get(`${BASE_URL}/destiny2`);
  const $ = cheerio.load(res.data);

  const emblems = [];

  $(".gridemblem-index .emblem a").each((_, el) => {
    const href = $(el).attr("href"); // z. B. /emblem?id=12345
    const idMatch = href.match(/id=(\d+)/);
    const id = idMatch ? idMatch[1] : null;
    const name = $(el).find("h2").text().trim();

    if (id && name) {
      emblems.push({ id, name });
    }
  });

  return emblems;
}

async function getEmblemDetails(id) {
  const res = await axios.get(`${BASE_URL}/emblem?id=${id}`);
  const $ = cheerio.load(res.data);

  const imageUrls = [];
  let source = "";
  const requirements = [];

  $("div.gridemblem-emblemdetail").each((_, el) => {
    const img = $(el).find("img").attr("src");
    if (img) {
      imageUrls.push(img);
    }

    const text = $(el).text().trim();
    if (text.startsWith("Source: ")) {
      source = text.replace("Source: ", "").trim();
    }

    const liItems = $(el).find("li");
    if (liItems.length > 0) {
      liItems.each((_, li) => {
        requirements.push($(li).text().trim());
      });
    }
  });

  return { images: imageUrls, source, requirements };
}

async function scrapeAll() {
  console.log("🔄 Loading Emblems ...");
  const emblemList = await getEmblemList();
  const fullData = [];

  for (const emblem of emblemList) {
    console.log(`🔍 Gathering Emblem details: ${emblem.name} (${emblem.id})`);
    try {
      const details = await getEmblemDetails(emblem.id);
      fullData.push({ ...emblem, ...details });
    } catch (e) {
      console.error(
        `❌ Error with Emblem ID ${emblem.id} / ${emblem.name}: ${e.message}`
      );
    }
  }

  fs.writeFileSync("./data/emblems.json", JSON.stringify(fullData, null, 2));
  console.log("✅ Done! Emblems exported to emblems.json");
}

scrapeAll();
