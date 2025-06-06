const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { FOOTER, EMBED_COLOR } = require("../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("credits")
    .setDescription("Displays credits"),

  async execute(interaction) {
    const dec_embed = new EmbedBuilder()
      .setTitle("DestinyEmblemCollector")
      .setDescription(
        "Thanks to @Jansten/DestinyEmblemCollector for providing data about every Emblem! <3"
      )
      .addFields(
        {
          name: "Links",
          value: `<:x_twitter:1368230590343549000> [@Jansten](https://x.com/Jansten)\n<:x_twitter:1368230590343549000> [@DestinyEmblemCollector](https://x.com/DestinyEmblemCollector)`,
          inline: true,
        },
        {
          name: "\u200B",
          value: `<:destinyemblemcollector:1368220405420003348> [Website](https://destinyemblemcollector.com/destiny2)\n<:network_IDS:1368241564966588642> [Bio](https://campsite.bio/jansten)`,
          inline: true,
        }
      )
      //
      .setColor(EMBED_COLOR)
      .setFooter(FOOTER);

    /*const emblemsreport_embed = new EmbedBuilder()
      .setTitle("emblems.report")
      .setDescription(
        "Data for the market value and redeemed status are from [emblems.report](https://emblems.report/)"
      )
      .addFields(
        {
          name: "Links",
          value: `<:x_twitter:1368230590343549000> [@emblemsreport](https://x.com/emblemsreport)\n<:emblemsreport:1371211171935289458> [emblems.report](https://emblems.report/)`,
          inline: true,
        },
        {
          name: "\u200B",
          value: `<:discord:1371211173801885809> [Discord](https://discord.gg/Sn9sdac9EU)`,
          inline: true,
        }
      )
      //
      .setColor(0xf5c518)
            .setFooter(FOOTER);*/

    await interaction.reply({
      content: "Credits go to:",
      embeds: [dec_embed /*, emblemsreport_embed*/],
    });
  },
};
