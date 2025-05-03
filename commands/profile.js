const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const data = require("../data/data.json");
require('dotenv').config();
const usersFilePath = path.join(__dirname, '../data/users.json');

function loadUsers() {
    if (!fs.existsSync(usersFilePath)) return {};
    return JSON.parse(fs.readFileSync(usersFilePath));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Shows info about your Destiny profile.'),

    async execute(interaction) {
        const { getValidAccessToken } = require('../utils/tokenManager');
        const accessToken = await getValidAccessToken(interaction.user.id);
        if (!accessToken) {
            await interaction.reply({ content: 'Token invalid or expired. Please use \`/link\` to re-link your profile.', ephemeral: true });
        }
        const users = loadUsers();
        const userData = users[interaction.user.id];
        if (userData) {
            // User ist verlinkt → Zeige Embed mit Bungie-Daten
            const embed = new EmbedBuilder()
                .setTitle('🔗 Your linked Bungie profile')
                .setColor(0x00AE86)
                .addFields(
                    { name: 'Display Name', value: userData.displayName, inline: true },
                    { name: 'Membership ID', value: userData.destinyMembershipId, inline: true },
                    { name: 'Token valid for', value: `${Math.floor((userData.tokenExpiresIn - ((Date.now() - userData.tokenCreatedAt) / 1000)) / 60)} minutes`, inline: true },
                )
                .setFooter({
                    text: `Destiny Intel | v ${data.version}`,
                    iconURL: "https://i.imgur.com/cVoKfFP.png",
                });

            await interaction.reply({ embeds: [embed] });

        } else {
            // Kein Eintrag → Button anbieten wie bei /link
            const bungieAuthURL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&state=${interaction.user.id}`;

            const embed = new EmbedBuilder()
                .setTitle('❌ Not linked!')
                .setDescription('You have not linked a profile yet.\nClick the button below to link your profile.')
                .setColor(0xf54242)
                .setFooter({
                    text: `Destiny Intel | v ${data.version}`,
                    iconURL: "https://i.imgur.com/cVoKfFP.png",
                });

            const button = new ButtonBuilder()
                .setLabel('Link with Bungie')
                .setStyle(ButtonStyle.Link)
                .setURL(bungieAuthURL);

            const row = new ActionRowBuilder().addComponents(button);

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    },
};