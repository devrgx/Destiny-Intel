const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emblems = require('../data/emblems.json'); // Die JSON-Datei mit den Emblemen
const data = require("../data/data.json")

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emblem')
    .setDescription('Zeigt Infos zu einem Destiny 2 Emblem')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Name des Emblems')
        .setAutocomplete(true)
        .setRequired(true)
    ),

  // Autocomplete-Funktion für die Namenssuche
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const filtered = emblems
      .filter(e => e.name.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25); // Discord erlaubt max. 25 Vorschläge

    await interaction.respond(
      filtered.map(e => ({ name: e.name, value: e.id }))
    );
  },

  // Der eigentliche Command, um ein Embed zu senden
  async execute(interaction) {
    const emblemId = interaction.options.getString('name');
    const emblem = emblems.find(e => e.id === emblemId);

    if (!emblem) {
      return interaction.reply({ content: 'Emblem nicht gefunden.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(emblem.name)
      .setDescription(`[DEC](https://destinyemblemcollector.com/emblem?id=${emblem.id})\n[emblem.report](https://emblem.report/${emblem.id})\n[light.gg](https://www.light.gg/db/items/${emblem.id})\n`)
      .addFields(
        { name: '**Source**', value: `${emblem.source}` },
        { name: '**Requirements:**', value: `${emblem.requirements.join('\n')}` }
      )
      .setThumbnail(emblem.images[0]) // Icon
      .setImage(emblem.images[2])     // Großes Bild
      .setColor(0x0099ff)
      .setFooter({ text: `Destiny Intel | v ${data.version}`, iconURL: 'https://i.imgur.com/cVoKfFP.png' });

    await interaction.reply({ embeds: [embed] });
  },
};