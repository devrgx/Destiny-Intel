const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Emblem = require("../models/Emblem");
require("dotenv").config();
const { notifyAdmin } = require("../../bot/utils/notify");
const chalk = require("chalk");

const emblemsFile = path.join(__dirname, "../../bot/data/emblems.json");

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.green("✅ [MongoDB] Connected"));
  } catch (err) {
    console.error(chalk.red("❌ [MongoDB] Connection failed:"), err.message);
    process.exit(1);
  }
}

const runImport = async function (client = null) {
  await connectToDB();

  if (!fs.existsSync(emblemsFile)) {
    console.error(chalk.red("❌ [Import] emblems.json not found"));
    process.exit(1);
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
      console.log(chalk.blue("➕ New emblem:"), emblem.name);
      continue;
    }

    const updatedFields = {};
    const keysToCompare = [
      "price", "redeemed", "available", "lastUpdated",
      "images", "source", "requirements", "priceSource"
    ];

    for (const key of keysToCompare) {
      const oldValue = JSON.stringify(match[key] ?? "");
      const newValue = JSON.stringify(emblem[key] ?? "");

      if (oldValue !== newValue) {
        updatedFields[key] = emblem[key];
        if (key === "price") {
          priceChanges.push({
            type: "price",
            name: emblem.name,
            detail: `Price: ${match.price} → ${emblem.price}`
          });
        }
        console.log(
          chalk.yellow(`✏️  ${emblem.name}`),
          chalk.gray(`[${key}]`),
          chalk.red("→"),
          chalk.green(emblem[key])
        );
      }
    }

    if (Object.keys(updatedFields).length > 0) {
      await Emblem.updateOne({ id: emblem.id }, { $set: updatedFields });
      changes.push({ type: "update", name: emblem.name, detail: updatedFields });
    }
  }

  if (client) {
    await notifyAdmin(client, changes, priceChanges);
  } else {
    console.log(chalk.green(`✅ [Import] Finished. ${changes.length} updated, ${priceChanges.length} price changes.`));
    process.exit(0);
  }
};

if (require.main === module) {
  runImport();
}

module.exports = { runImport };