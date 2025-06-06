module.exports = function isAdmin(discordUserId) {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map(id => id.trim())
    .includes(discordUserId);
};