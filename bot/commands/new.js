const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const { fetchFromAPI } = require("../utils/api");
const {
  FOOTER,
  EMBED_COLOR,
  ADMIN_USER_ID,
  ANNOUNCEMENT_CHANNEL_ID,
} = require("../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("new")
    .setDescription("[ADMIN] Post a specific emblem to announcement channel.")
    .addStringOption((option) =>
      option.setName("id").setDescription("ID of the Emblem:").setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.user.id !== ADMIN_USER_ID) {
      return interaction.reply({
        content: "You are not authorized to use this command.",
        ephemeral: true,
      });
    }

    const emblemId = interaction.options.getString("id");
    const emblem = await fetchFromAPI(`/emblem/${emblemId}`);

    if (!emblem || emblem.error) {
      return interaction.reply({
        content: "No emblem found with that ID.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(emblem.name)
      .addFields(
        { name: "**Source**", value: `${emblem.source || "_unknown_"}` },
        {
          name: "**Requirements:**",
          value: `${emblem.requirements?.join("\n") || "_unknown_"}`,
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
          value:
            "Some links may not work if the emblem isn't fully published yet.",
        }
      )
      .setThumbnail(emblem.images?.[0] || null)
      .setImage(emblem.images?.[2] || null)
      .setColor(EMBED_COLOR)
      .setFooter(FOOTER);

    try {
      const channel = await interaction.client.channels.fetch(
        ANNOUNCEMENT_CHANNEL_ID
      );

      if (!channel || channel.type !== ChannelType.GuildAnnouncement) {
        return interaction.reply({
          content:
            "The specified channel is not an Announcement channel or couldn't be found.",
          ephemeral: true,
        });
      }

      const sentMessage = await channel.send({ embeds: [embed] });
      await sentMessage.crosspost();

      await interaction.reply({
        content: "Emblem was successfully posted and published!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Failed to send or publish message:", error);
      await interaction.reply({
        content: "An error occurred while sending or publishing the message.",
        ephemeral: true,
      });
    }
  },
};
