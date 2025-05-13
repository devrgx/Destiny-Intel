const mongoose = require("mongoose");

const emblemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  images: { type: [String], required: true },
  source: { type: String, required: false } || "unknown",
  requirements: { type: [String], required: true }, // Hier auf ein Array von Strings geändert
  available: { type: Boolean, required: true },
  price: { type: String, required: false } || "unknown",
});

const Emblem = mongoose.model("Emblem", emblemSchema);

module.exports = Emblem;
