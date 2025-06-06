require("dotenv").config();

module.exports = {
  FOOTER: {
    text: `Destiny Intel | v${process.env.BOT_VERSION || "unknown"}`,
    iconURL: "https://i.imgur.com/cVoKfFP.png",
  },
  EMBED_COLOR: 0x0099ff,
  ADMIN_USER_ID: process.env.ADMIN_USER_ID,
  ANNOUNCEMENT_CHANNEL_ID: process.env.ANNOUNCEMENT_CHANNEL_ID,
};