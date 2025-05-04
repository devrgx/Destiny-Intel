const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const emblems = require("../data/emblems.json");
const data = require("../data/data.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emblem")
    .setDescription("Displays info about selected Emblem!")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the Emblem:")
        .setAutocomplete(true)
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const filtered = emblems
      .filter((e) => e.name.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(
      filtered.map((e) => ({ name: e.name, value: e.id }))
    );
  },

  async execute(interaction) {
    const emblemId = interaction.options.getString("name");
    const emblem = emblems.find((e) => e.id === emblemId);

    if (!emblem) {
      return interaction.reply({
        content: "No Emblem found with that name.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(emblem.name)
      //.setDescription(`[DEC](https://destinyemblemcollector.com/emblem?id=${emblem.id})\n[emblem.report](https://emblem.report/${emblem.id})\n[light.gg](https://www.light.gg/db/items/${emblem.id})\n`)
      .addFields(
        { name: "**Source**", value: `${emblem.source}` },
        {
          name: "**Requirements:**",
          value: `${emblem.requirements.join("\n")}`,
        },
        {
          name: "Links",
          value: `<:destinyemblemcollector:1368220405420003348> [DEC](https://destinyemblemcollector.com/emblem?id=${emblem.id})\n<:emblemreport:1368220407127081031> [emblem.report](https://emblem.report/${emblem.id})`,
          inline: true,
        },
        {
          name: "\u200B",
          value: `<:lightgg:1368220409039683594> [light.gg](https://www.light.gg/db/items/${emblem.id})\n<:dataexplorer:1368220403281035366> [DataExplorer](https://data.destinysets.com/i/InventoryItem:${emblem.id})`,
          inline: true,
        }
      )
      .setThumbnail(emblem.images[0]) // Icon
      .setImage(emblem.images[2]) // Großes Bild
      .setColor(0x0099ff)
      .setFooter({
        text: `Destiny Intel | v ${data.version}`,
        iconURL: "https://i.imgur.com/cVoKfFP.png",
      });

    await interaction.reply({ embeds: [embed] });
  },
};
