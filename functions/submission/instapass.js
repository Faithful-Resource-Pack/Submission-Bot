const settings = require("../../resources/settings.json");

const downloadResults = require("./downloadResults");
const warnUser = require("../../helpers/warnUser");

/**
 * Instapass a given texture embed
 * @author Evorp
 * @param {import("discord.js").Client} client discord client
 * @param {import("discord.js").Message} message embed to instapass
 */
module.exports = async function instapass(client, message) {
	let channelOutID;
	let channelArray;

	for (let pack of Object.values(settings.submission.packs)) {
		// picks up instapassing in both community and council phases
		channelArray = Object.values(pack.channels);
		if (channelArray.includes(message.channel.id)) {
			channelOutID = pack.channels.results;
			break;
		}
	}

	const channelOut = await client.channels.fetch(channelOutID);

	if (!channelOut) return warnUser(message, "Result channel was not able to be fetched!");

	await channelOut.send({
		embeds: [
			message.embeds[0]
				.setColor(settings.colors.yellow)
				.setDescription(`[Original Post](${message.url})\n${message.embeds[0].description ?? ""}`),
		],
		components: [...message.components],
	});

	await downloadResults(client, channelOutID, true);
};
