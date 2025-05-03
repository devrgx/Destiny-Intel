const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const data = require("../data/data.json");

module.exports = {
    data: new SlashCommandBuilder().setName("credits").setDescription("Displays credits"),
  
    async execute(interaction) {

      const dec_embed = new EmbedBuilder()
        .setTitle("DestinyEmblemCollector")
        .setDescription("Thanks to @Jansten/DestinyEmblemCollector for providing data about every Emblem! <3")
        .addFields(
            { name: 'Links', value: `<:x_twitter:1368230590343549000> [@Jansten](https://x.com/Jansten)\n<:x_twitter:1368230590343549000> [@DestinyEmblemCollector](https://x.com/DestinyEmblemCollector)` , inline: true },
            { name: '\u200B', value: `<:destinyemblemcollector:1368220405420003348> [Website](https://destinyemblemcollector.com/destiny2)\n<:network_IDS:1368241564966588642> [Bio](https://campsite.bio/jansten)` , inline: true }

          )
        //
        .setColor(0x0099ff)
        .setFooter({
          text: `Destiny Intel | v ${data.version}`,
          iconURL: "https://i.imgur.com/cVoKfFP.png",
        });

      await interaction.reply({ content: "Credits go to:" , embeds: [dec_embed] });
    },
  };
  