const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.DirectMessages] });

async function notifyOwner(message) {
  await client.login(process.env.DISCORD_TOKEN);
  try {
    const user = await client.users.fetch(process.env.ADMIN_USER_ID);
    await user.send(message);
    console.log("📩 Notification sent to admin.");
  } catch (err) {
    console.error("❌ Failed to send DM:", err.message);
  } finally {
    client.destroy();
  }
}

module.exports = { notifyOwner };