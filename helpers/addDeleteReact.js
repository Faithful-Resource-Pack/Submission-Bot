const settings = require("../resources/settings.json");

/**
 * Add a trash can emote and await it, if used, the authorMessage is deleted, does nothing if sentMessage is in DM
 * @param {import('discord.js').Message} sentMessage message sent by the bot
 * @param {import('discord.js').Message} authorMessage message the bot has respond to
 * @param {Boolean} deleteAuthorMessage If author message is delete with it
 * @param {import('discord.js').Message} redirectMessage message it is redirected from
 */
module.exports = async function addDeleteReact(
	sentMessage,
	authorMessage,
	deleteAuthorMessage = false,
	redirectMessage = undefined,
) {
	if (sentMessage.channel.type === "DM") return;

	await sentMessage.react(settings.emojis.delete);

	const filter = (reaction, user) => {
		if (redirectMessage)
			return (
				!user.bot &&
				[settings.emojis.delete].includes(reaction.emoji.id) &&
				user.id === redirectMessage.author.id
			);
		else
			return (
				!user.bot &&
				[settings.emojis.delete].includes(reaction.emoji.id) &&
				user.id === authorMessage.author.id
			);
	};
	try {
		const collected = await sentMessage.awaitReactions({
			filter,
			max: 1,
			time: 60000,
			errors: ["time"],
		});
		const reaction = collected.first();
		if (reaction.emoji.id !== settings.emojis.delete) {
			return;
		}

		await sentMessage.delete();
		if (redirectMessage) {
			if (deleteAuthorMessage) {
				redirectMessage = await redirectMessage.fetch(true).catch(() => {}); // fix for unknown message
				if (redirectMessage?.deletable) await redirectMessage.delete();
			}
		} else if (deleteAuthorMessage) {
			authorMessage = await authorMessage.fetch(true).catch(() => {}); // fix for unknown message
			if (authorMessage?.deletable) await authorMessage.delete();
		}
	} catch {
		// only error cause is timeout, so delete the
		sentMessage = await sentMessage.fetch(true).catch(() => {}); // fix for unknown message
		if (sentMessage?.deletable) {
			const deleteReaction = sentMessage.reactions.cache.get(settings.emojis.delete);
			if (deleteReaction !== undefined) await deleteReaction.remove().catch(() => {}); // FIX for undefined delete reaction remove
		}
	}
};
