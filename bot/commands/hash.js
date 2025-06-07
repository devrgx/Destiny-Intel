const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const emblems = require("../../data/emblems.json");
const { EMBED_COLOR, FOOTER_TEXT, FOOTER_ICON } = require("../../utils/constants");

// 🔐 Admins aus .env einlesen
const ADMIN_IDS = process.env.ADMINS?.split(",").map(id => id.trim()) || [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hash")
    .setDescription("Admin tool for collectibleHashes")
    .addSubcommand(sub =>
      sub.setName("missing").setDescription("Show emblems without collectibleHash")
    )
    .addSubcommand(sub =>
      sub.setName("sync").setDescription("Fetch fresh collectibleHashes from Bungie API")
    ),

  async execute(interaction) {
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({
        content: "❌ You do not have permission to use this command.",
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === "missing") {
      const hashMap = require("../../data/hash.json");
      const missing = emblems.filter(e => !hashMap[e.id]);

      const embed = new EmbedBuilder()
        .setTitle("❗ Missing collectibleHashes")
        .setColor(EMBED_COLOR)
        .setDescription(
          missing.slice(0, 20).map(e => `• **${e.name}** (\`${e.id}\`)`).join("\n") +
          (missing.length > 20 ? `\n...and ${missing.length - 20} more.` : "")
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON });

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === "sync") {
      const apiKey = process.env.BUNGIE_API_KEY;
      const headers = { "X-API-Key": apiKey };

      try {
        const manifestRes = await axios.get("https://www.bungie.net/Platform/Destiny2/Manifest/", { headers });
        const itemDefPath = manifestRes.data.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition;
        const itemDefRes = await axios.get(`https://www.bungie.net${itemDefPath}`, { headers });

        const itemDefs = itemDefRes.data;
        const hashMap = {};
        let added = 0, missing = 0;

        for (const emblem of emblems) {
          const item = itemDefs[emblem.id];
          if (item && item.collectibleHash) {
            hashMap[emblem.id] = item.collectibleHash.toString();
            added++;
          } else {
            missing++;
          }
        }

        const outputPath = path.join(__dirname, "../../data/hash.json");
        fs.writeFileSync(outputPath, JSON.stringify(hashMap, null, 2));

        const embed = new EmbedBuilder()
          .setTitle("🔁 Hashes Synced")
          .setColor(EMBED_COLOR)
          .setDescription(`✅ **${added}** hashes saved\n⚠️ **${missing}** still missing`)
          .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON });

        return interaction.editReply({ embeds: [embed] });

      } catch (err) {
        console.error("❌ [hash sync]", err.message);
        return interaction.editReply({ content: "❌ Failed to sync hashes.", ephemeral: true });
      }
    }
  }
};