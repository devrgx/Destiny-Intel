const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data = require("../data/data.json")

module.exports = {
    data: new SlashCommandBuilder()
      .setName('icon')
      .setDescription('displays the icon'),

  
    async execute(interaction) {
  
      const embed = new EmbedBuilder()
        .setTitle("Icon")
        //.setDescription(`[DEC](https://destinyemblemcollector.com/emblem?id=${emblem.id})\n[emblem.report](https://emblem.report/${emblem.id})\n[light.gg](https://www.light.gg/db/items/${emblem.id})\n`)
        .setImage("https://i.imgur.com/cVoKfFP.png")     // Großes Bild
        .setColor(0x0099ff)
        .setFooter({ text: `Destiny Intel | v ${data.version}`, iconURL: 'https://i.imgur.com/cVoKfFP.png' });
  
      await interaction.reply({ embeds: [embed] });
    },
  };