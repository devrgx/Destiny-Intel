const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const mongoose = require("mongoose");
const { FOOTER, EMBED_COLOR } = require("../constants");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Displays bot, API, and database latency."),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: "🏓 Pinging...",
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    let apiStatus = "❌ Error";
    let apiResponseTime = "-";

    try {
      const start = Date.now();
      const response = await axios.get(`${process.env.API_BASE_URL}/ping`);
      const duration = Date.now() - start;
      if (response.status === 200) {
        apiStatus = "✅ Online";
        apiResponseTime = `${duration}ms`;
      }
    } catch (err) {
      console.error("API ping failed:", err.message);
    }

    const dbStatus =
      mongoose.connection.readyState === 1
        ? "✅ Connected"
        : "❌ Not connected";

    const embed = new EmbedBuilder()
      .setTitle("🏓 Pong!")
      .setDescription("Current latency and system status:")
      .setColor(EMBED_COLOR)
      .addFields(
        { name: "Bot Latency", value: `${latency}ms`, inline: true },
        {
          name: "API Response Time",
          value: `${apiResponseTime}`,
          inline: true,
        },
        { name: "API Status", value: `${apiStatus}`, inline: true },
        { name: "API Endpoint", value: `${process.env.API_BASE_URL}/ping` },
        { name: "Discord API Latency", value: `${apiLatency}ms`, inline: true },
        { name: "MongoDB", value: dbStatus }
      )
      .setFooter(FOOTER);

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
