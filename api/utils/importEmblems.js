const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Emblem = require("../models/Emblem");
require("dotenv").config();
const { notifyAdmin } = require("../../bot/utils/notify");

const emblemsFile = path.join(__dirname, "../../bot/data/emblems.json");

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ [MongoDB] Connected");
  } catch (err) {
    console.error("❌ [MongoDB] Connection failed:", err.message);
    process.exit(1);
  }
}

const runImport = async function (client = null) {
  await connectToDB();

  if (!fs.existsSync(emblemsFile)) {
    console.error("❌ [Import] emblems.json not found");
    return;
  }

  const newData = JSON.parse(fs.readFileSync(emblemsFile, "utf8"));
  const dbData = await Emblem.find();

  const changes = [];
  const priceChanges = [];

  for (const emblem of newData) {
    const match = dbData.find(e => e.id === emblem.id);
    if (!match) {
      changes.push({ type: "new", name: emblem.name, detail: "New emblem" });
      await Emblem.create(emblem);
      continue;
    }

    const updatedFields = {};
    if (match.price !== emblem.price) {
      updatedFields.price = emblem.price;
      priceChanges.push({
        type: "price",
        name: emblem.name,
        detail: `Price: ${match.price} → ${emblem.price}`,
      });
    }

    if (Object.keys(updatedFields).length > 0) {
      await Emblem.updateOne({ id: emblem.id }, { $set: updatedFields });
      changes.push(...priceChanges.slice(-1));
    }
  }

  // DM an Admin
  if (client && process.env.ADMIN_USER_ID) {
    try {
      const admin = await client.users.fetch(process.env.ADMIN_USER_ID);
      if (changes.length > 0) {
        const msg =
          `📦 Emblem update completed.\n\n` +
          changes.map((c) => `• ${c.name}: ${c.detail}`).join("\n");
        await admin.send(msg);
      }
    } catch (err) {
      console.warn("⚠️ Failed to send DM:", err.message);
    }
  }

  // Nachricht in Channel bei Preisänderung
  if (client && process.env.NOTIFY_CHANNEL_ID && priceChanges.length > 0) {
    try {
      const channel = client.channels.cache.get(process.env.NOTIFY_CHANNEL_ID);
      const msg =
        `✏️ Emblem price changes:\n\n` +
        priceChanges.map((c) => `• ${c.name}: ${c.detail}`).join("\n");
      await channel.send(msg);
    } catch (err) {
      console.warn("⚠️ Failed to send channel message:", err.message);
    }
  }

  console.log(
    `✅ [Import] Done. Total changes: ${changes.length}, price changes: ${priceChanges.length}`
  );
};

module.exports = runImport;

if (require.main === module) {
  runImport(); // funktioniert im CLI
}