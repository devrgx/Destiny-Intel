const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const emblemItemHashes = []; // optional: z.B. ["3320175784", "2588647367"]

async function getManifestUrl() {
  const res = await axios.get("https://www.bungie.net/Platform/Destiny2/Manifest/", {
    headers: { "X-API-Key": process.env.BUNGIE_API_KEY },
  });
  return "https://www.bungie.net" + res.data.Response.jsonWorldComponentContentPaths.en.DestinyCollectibleDefinition;
}

async function main() {
  console.log("📥 Fetching DestinyCollectibleDefinition...");
  const collectiblesUrl = await getManifestUrl();
  const collectibles = (await axios.get(collectiblesUrl)).data;

  const itemToCollectible = {};
  const itemToRecord = {};

  for (const collectibleHash in collectibles) {
    const c = collectibles[collectibleHash];
    if (c.itemHash && (emblemItemHashes.length === 0 || emblemItemHashes.includes(String(c.itemHash)))) {
      const itemHash = String(c.itemHash);
      itemToCollectible[itemHash] = collectibleHash;
      itemToRecord[itemHash] = collectibleHash; // recordHash = collectibleHash
    }
  }

  const outPath1 = path.join(__dirname, "item-to-collectible.json");
  const outPath2 = path.join(__dirname, "item-to-record.json");

  fs.writeFileSync(outPath1, JSON.stringify(itemToCollectible, null, 2));
  fs.writeFileSync(outPath2, JSON.stringify(itemToRecord, null, 2));

  console.log(`✅ Saved ${Object.keys(itemToCollectible).length} collectible mappings to ${outPath1}`);
  console.log(`✅ Saved ${Object.keys(itemToRecord).length} record mappings to ${outPath2}`);
}

main();