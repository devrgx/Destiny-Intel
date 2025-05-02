const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emblems = require('../data/emblems.json'); // Die JSON-Datei mit den Emblemen

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
      .setDescription(`**Source:** ${emblem.source}\n\n**Requirements:**\n${emblem.requirements.join('\n')}`)
      .setThumbnail(emblem.images[0]) // Icon
      .setImage(emblem.images[2])     // Großes Bild
      .setColor(0x0099ff);

    await interaction.reply({ embeds: [embed] });
  },
};