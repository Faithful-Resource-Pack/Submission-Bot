const settings = require("@resources/settings.json");

const getMessages = require("@helpers/getMessages");

/**
 * @typedef MappedMessage
 * @property {import("discord.js").MessageReaction} upvote
 * @property {import("discord.js").MessageReaction} downvote
 * @property {import("discord.js").Embed} embed
 * @property {import("discord.js").MessageComponent[]} components
 * @property {import("discord.js").Message} message
 */

/**
 * Filter submissions from a given date and split by vote counts
 * @author Juknum
 * @param {import("discord.js").Client} client
 * @param {string} channelID where to retrieve from
 * @param {number} delay delay in days from day of retrieval
 * @returns {Promise<{messagesUpvoted: MappedMessage[], messagesDownvoted: MappedMessage[]}>}
 */
module.exports = async function retrieveSubmission(client, channelID, delay) {
	const delayedDate = new Date();
	delayedDate.setDate(delayedDate.getDate() - delay);

	const messages = await getMessages(client, channelID, (message) => {
		const messageDate = new Date(message.createdTimestamp);
		return (
			// correct date
			messageDate.getDate() == delayedDate.getDate() &&
			messageDate.getMonth() == delayedDate.getMonth() &&
			messageDate.getFullYear() == delayedDate.getFullYear() &&
			// only get pending submissions
			message.embeds?.[0]?.fields[1]?.value?.includes(settings.emojis.pending)
		);
	});

	/** @type {MappedMessage[]} */
	const mappedMessages = messages.map((message) => {
		return {
			upvote: message.reactions.cache.get(settings.emojis.upvote),
			downvote: message.reactions.cache.get(settings.emojis.downvote),
			embed: message.embeds[0],
			components: [...message.components],
			message: message,
		};
	});

	const messagesUpvoted = mappedMessages.filter((message) => {
		// set to one because bot reaction (0 can never be reached)
		if (!message.upvote) message.upvote.count = 1;
		if (!message.downvote) message.downvote.count = 1;

		return (
			message.upvote.count > message.downvote.count ||
			// if nobody voted assume nobody cares
			(message.upvote.count == 1 && message.downvote.count == 1)
		);
	});

	return {
		messagesUpvoted,
		// whatever isn't in messagesUpvoted is denied (reduces redundancy this way)
		messagesDownvoted: mappedMessages.filter((msg) => !messagesUpvoted.includes(msg)),
	};
};
