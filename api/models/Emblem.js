const mongoose = require("mongoose");

const emblemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  collectibleHash: { type: String, default: null },
  recordHash: { type: String, default: null },
  name: { type: String, required: true },
  images: { type: [String], required: true },
  source: { type: String, default: "unknown" },
  requirements: { type: [String], required: true },
  available: { type: Boolean, required: true },
  price: { type: String, default: "unknown" },
  redeemed: { type: String, default: "error" },
  priceSource: { type: String, default: "cache" },
  lastUpdated: { type: Date, default: null },
});

module.exports = mongoose.model("Emblem", emblemSchema);