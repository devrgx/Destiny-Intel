const { SlashCommandBuilder , EmbedBuilder } = require('discord.js');
const data = require("../data/data.json")
const emblems = require('../data/emblems.json');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('count')
      .setDescription('Displays the amount Emblems currently tracked by (DEC)!'),
  
    async execute(interaction) {
        const amount = emblems.length        
    
  
      const embed = new EmbedBuilder()
          .setTitle("Destiny Intel")
          .setDescription(`There are currently **${amount}** tracked Destiny 2 Emblems by [DEC](https://destinyemblemcollector.com/destiny2)!`)
          .setColor(0x0099ff)
          .setFooter({ text: `Destiny Intel | v ${data.version}`, iconURL: 'https://i.imgur.com/cVoKfFP.png' });
  
      await interaction.reply({ embeds: [embed] })
    }
  };