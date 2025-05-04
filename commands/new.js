const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const emblems = require("../data/emblems.json");
const data = require("../data/data.json");
const ADMIN_USER_ID = "330992301558202378";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("new")
    .setDescription("[ADMIN] Displays info about selected Emblem!")
    .addStringOption((option) =>
      option.setName("id").setDescription("ID of the Emblem:").setRequired(true)
    ),

  async execute(interaction) {
    // Überprüfen, ob der Benutzer der Admin ist
    if (interaction.user.id !== ADMIN_USER_ID) {
      return interaction.reply({
        content: "You are not the Admin of the Bot, sorry!.",
        ephemeral: true,
      });
    }

    const emblemId = interaction.options.getString("id");
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
        },
        {
          name: "Info:",
          value: `Some links may not work (DEC wil most likely work), if the emblems have temporary pages (e.g. are not in the API yet)`,
          inline: false,
        }
      )
      .setThumbnail(emblem.images[0]) // Icon
      .setImage(emblem.images[2]) // Großes Bild
      .setColor(0x0099ff)
      .setFooter({
        text: `Destiny Intel | v ${data.version}`,
        iconURL: "https://i.imgur.com/cVoKfFP.png",
      });

    // Hole den spezifischen Kanal
    const channel = await interaction.client.channels.fetch(
      "1367631268015116319"
    );

    if (!channel || channel.type !== ChannelType.GuildAnnouncement) {
      return interaction.reply({
        content:
          "Der angegebene Kanal ist kein Announcement-Channel oder konnte nicht gefunden werden.",
        ephemeral: true,
      });
    }

    try {
      // Sende die Nachricht
      const sentMessage = await channel.send({ embeds: [embed] });

      // Veröffentliche sie automatisch
      await sentMessage.crosspost();

      // Erfolgsmeldung
      await interaction.reply({
        content: "Emblem wurde erfolgreich gesendet und veröffentlicht!",
        ephemeral: true,
      });
    } catch (error) {
      console.error(
        "Fehler beim Senden oder Veröffentlichen der Nachricht:",
        error
      );
      await interaction.reply({
        content:
          "Beim Senden oder Veröffentlichen der Nachricht ist ein Fehler aufgetreten.",
        ephemeral: true,
      });
    }
  },
};
