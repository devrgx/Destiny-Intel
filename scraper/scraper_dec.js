const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://destinyemblemcollector.com";

// Emblem-Liste von /destiny2
async function getEmblemList() {
  const res = await axios.get(`${BASE_URL}/destiny2`);
  const $ = cheerio.load(res.data);

  const emblems = [];

  $(".gridemblem-index .emblem a").each((_, el) => {
    const href = $(el).attr("href");
    const idMatch = href.match(/id=(\d+)/);
    const id = idMatch ? idMatch[1] : null;
    const name = $(el).find("h2").text().trim();

    if (id && name) {
      emblems.push({ id, name });
    }
  });

  return emblems;
}

// Details zu einem Emblem abrufen
async function getEmblemDetails(id) {
  const res = await axios.get(`${BASE_URL}/emblem?id=${id}`);
  const $ = cheerio.load(res.data);

  const imageUrls = [];
  let source = "";
  const requirements = [];

  const statusText = $("p").filter((_, el) => {
    const text = $(el).text().trim();
    return text.includes("Emblem Currently Available") || text.includes("Emblem Is NOT Currently Available");
  }).first();

  let available = false;
  if (statusText.length > 0) {
    const text = statusText.text().trim();
    available = text === "Emblem Currently Available";
  }

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
    liItems.each((_, li) => {
      requirements.push($(li).text().trim());
    });
  });

  return { images: imageUrls, source, requirements, available };
}

// Hauptfunktion
async function scrapeAll() {
  console.log("🔄 Lade Emblems ...");
  const emblemList = await getEmblemList();
  const fullData = [];

  for (const emblem of emblemList) {
    console.log(`🔍 Details für ${emblem.name} (${emblem.id})`);
    try {
      const details = await getEmblemDetails(emblem.id);
      fullData.push({ ...emblem, ...details });
    } catch (e) {
      console.error(`❌ Fehler bei ${emblem.id} / ${emblem.name}: ${e.message}`);
    }
  }

  // Zielpfad robust erstellen
  const outputPath = path.join(__dirname, "../bot/data/emblems.json");
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(fullData, null, 2));
  console.log(`✅ Fertig! Emblems exportiert nach ${outputPath}`);
}

scrapeAll();