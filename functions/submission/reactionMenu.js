const settings = require("@resources/settings.json");

const { Permissions } = require("discord.js");
const instapass = require("@submission/utility/instapass");
const changeStatus = require("@submission/utility/changeStatus");
const { imageButtons } = require("@helpers/interactions");
const DEBUG = process.env.DEBUG.toLowerCase() == "true";
/**
 * Opens reaction tray, listens for reaction, and closes tray
 * @author Evorp, Juknum
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").MessageReaction} openReaction reaction that opened the tray
 * @param {import("discord.js").User} user person who reacted
 */
module.exports = async function reactionMenu(client, openReaction, user) {
	const message = await openReaction.message.fetch();
	const member = message.guild.members.cache.get(user.id);
	if (member.bot) return;

	let trayReactions = [
		settings.emojis.see_less,
		settings.emojis.delete,
		settings.emojis.instapass,
		settings.emojis.invalid,
	];

	// if you don't check to close tray first, the bot won't listen for reactions upon restart
	if (openReaction.emoji.id == settings.emojis.see_less) {
		removeReactions(message, trayReactions);
		await message.react(settings.emojis.see_more);
	}

	if (openReaction.emoji.id !== settings.emojis.see_more || !message.embeds[0]?.fields?.length)
		return;
	if (DEBUG) console.log(`Reaction tray opened by: ${user.username}`);

	// first author in the author field is always the person who submitted
	const authorID = message.embeds[0].fields[0].value.split("\n")[0].replace(/\D+/g, "");

	if (
		// break early if the user doesn't have permission or the submission isn't pending
		(!member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) &&
			!member.roles.cache.some((role) => role.name.toLowerCase().includes("council")) &&
			authorID !== user.id) ||
		!message.embeds[0].fields[1].value.includes(settings.emojis.pending)
	)
		return openReaction.users.remove(user.id).catch((err) => {
			if (DEBUG) console.error(err);
		});

	// remove the arrow emoji and generate the tray
	openReaction.remove().catch((err) => {
		if (DEBUG) console.error(err);
	});

	// if the submission is in council remove delete reaction (avoid misclick)
	const councilChannels = Object.values(settings.submission.packs).map(
		(pack) => pack.channels.council,
	);

	if (councilChannels.includes(message.channel.id))
		trayReactions = trayReactions.filter((emoji) => emoji !== settings.emojis.delete);

	// remove instapass/invalid if just the author is reacting
	if (
		!member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) &&
		!member.roles.cache.some((role) => role.name.toLowerCase().includes("council"))
	)
		trayReactions = trayReactions.filter(
			(emoji) => emoji !== settings.emojis.instapass && emoji !== settings.emojis.invalid,
		);

	// actually react
	for (const emoji of trayReactions) await message.react(emoji);

	// make the filter
	const filter = (collectedReaction, collectedUser) =>
		trayReactions.includes(collectedReaction.emoji.id) && collectedUser.id === user.id;

	// await reaction from the user
	const collected = await message
		.awaitReactions({ filter, max: 1, time: 30000, errors: ["time"] })
		.catch(async (err) => {
			if (message.deletable) {
				removeReactions(message, trayReactions);
				await message.react(settings.emojis.see_more);
			}

			console.log(err);
		});

	/** @type {import("discord.js").MessageReaction} */
	const actionReaction = collected?.first();

	// if there's no reaction collected just reset the message and return early
	if (!actionReaction) {
		if (message.deletable) {
			removeReactions(message, trayReactions);
			await message.react(settings.emojis.see_more);
		}
		return;
	}

	/** @type {String} used to check permissions */
	const reactorID = [...actionReaction.users.cache.values()]
		.filter((user) => !user.bot)
		.map((user) => user.id)[0];

	if (
		actionReaction.emoji.id == settings.emojis.delete &&
		(reactorID === authorID || member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) &&
		message.deletable
	)
		return await message.delete();

	// instapass and invalid need role checks
	if (
		member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) ||
		member.roles.cache.some((role) => role.name.toLowerCase().includes("council"))
	) {
		switch (actionReaction.emoji.id) {
			case settings.emojis.instapass:
				// flush votes and reaction menu
				removeReactions(message, [
					settings.emojis.upvote,
					settings.emojis.downvote,
					...trayReactions,
				]);
				changeStatus(
					message,
					`<:instapass:${settings.emojis.instapass}> Instapassed by <@${member.id}>`,
					settings.colors.yellow,
					[imageButtons],
				);
				return instapass(client, message);
			case settings.emojis.invalid:
				removeReactions(message, [
					settings.emojis.upvote,
					settings.emojis.downvote,
					...trayReactions,
				]);
				return changeStatus(
					message,
					`<:invalid:${settings.emojis.invalid}> Invalidated by <@${member.id}>`,
					settings.colors.red,
				);
		}
	}

	// reset reactions if nothing happened
	removeReactions(message, trayReactions);
	await message.react(settings.emojis.see_more);
};

/**
 * Convenience method to remove multiple reactions at once
 * @author Juknum
 * @param {import("discord.js").Message} message where to remove reactions from
 * @param {String[]} emojis what to remove
 */
async function removeReactions(message, emojis) {
	for (const emoji of emojis) {
		message.reactions.cache
			.get(emoji)
			?.remove()
			?.catch((err) => {
				if (DEBUG) console.log(err);
			});
	}
}
