const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const BASE_URL = "https://destinyemblemcollector.com";

// Emblem-Liste von /destiny2
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

// Details zu einem Emblem abrufen
async function getEmblemDetails(id) {
  const res = await axios.get(`${BASE_URL}/emblem?id=${id}`);
  const $ = cheerio.load(res.data);

  const imageUrls = [];
  let source = "";
  const requirements = [];

  // Überprüfen des Verfügbarkeitstexts
  const statusText = $("p").filter((_, el) => {
    const text = $(el).text().trim();
    return text.includes("Emblem Currently Available") || text.includes("Emblem Is NOT Currently Available");
  }).first(); // Wir nehmen nur den ersten Treffer

  let available = false;

  // Bestimmen der Verfügbarkeit anhand des Texts
  if (statusText.length > 0) {
    const text = statusText.text().trim();

    if (text === "Emblem Currently Available") {
      available = true;
    } else if (text === "Emblem Is NOT Currently Available") {
      available = false;
    }
  }

  // Weitere Emblem-Details abrufen
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
      console.error(
        `❌ Fehler bei ${emblem.id} / ${emblem.name}: ${e.message}`
      );
    }
  }

  fs.writeFileSync("./data/emblems.json", JSON.stringify(fullData, null, 2));
  console.log("✅ Fertig! Emblems exportiert nach ./data/emblems.json");
}

scrapeAll();