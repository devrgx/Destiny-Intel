const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const API_KEY = process.env.BUNGIE_API_KEY;
const emblems = require("../bot/data/emblems.json");

async function fetchManifest() {
  const res = await axios.get("https://www.bungie.net/Platform/Destiny2/Manifest/", {
    headers: { "X-API-Key": API_KEY }
  });

  return res.data.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition;
}

async function downloadInventoryItemDefs(manifestPath) {
  const res = await axios.get(`https://www.bungie.net${manifestPath}`, {
    headers: { "X-API-Key": API_KEY }
  });

  return res.data;
}

async function generateHashMap() {
  console.log("📦 [Manifest] Downloading manifest...");
  const manifestPath = await fetchManifest();
  const itemDefs = await downloadInventoryItemDefs(manifestPath);

  console.log("🔍 [Hashes] Extracting collectibleHashes...");
  const hashMap = {};

  for (const emblem of emblems) {
    const itemDef = itemDefs[emblem.id];
    if (itemDef && itemDef.collectibleHash) {
      hashMap[emblem.id] = itemDef.collectibleHash.toString();
    } else {
      console.log(`⚠️ [Missing] No collectibleHash for ${emblem.name} (${emblem.id})`);
    }
  }

  const outputPath = path.join(__dirname, "../bot/data/hash.json");
  fs.writeFileSync(outputPath, JSON.stringify(hashMap, null, 2));
  console.log(`✅ [Done] Saved ${Object.keys(hashMap).length} hashes to bot/data/hash.json`);
}

generateHashMap().catch(err => {
  console.error("❌ [Error]", err.message);
});