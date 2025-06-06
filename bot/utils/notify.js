require("dotenv").config();

/**
 * Send a DM to the admin user.
 * @param {import('discord.js').Client} client - Your Discord.js client (should be already logged in)
 * @param {string} message - The message to send
 */
async function notifyAdmin(client, message) {
  try {
    const user = await client.users.fetch(process.env.ADMIN_USER_ID);
    await user.send(message);
    console.log("📩 Notification sent to admin.");
  } catch (err) {
    console.error("❌ Failed to send DM:", err.message);
  }
}

module.exports = { notifyAdmin };