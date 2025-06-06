const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  bungieMembershipId: String,
  destinyMembershipId: String,
  membershipType: { type: Number, required: true }, // <--- NEU!
  displayName: String,
  accessToken: String,
  refreshToken: String,
  tokenCreatedAt: Number,
  tokenExpiresIn: Number,
});

module.exports = mongoose.model("User", userSchema);