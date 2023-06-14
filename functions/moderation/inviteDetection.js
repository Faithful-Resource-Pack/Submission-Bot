const settings = require('../../resources/settings.json')

const { MessageEmbed } = require('discord.js');

/**
 * Send an embed message when triggered
 * @param {Discord} client Discord Client
 * @param {Discord} message Discord Message
 */
async function inviteDetection(client, message) {
	if (!message.member) return
	if (message.member.permissions.has("MANAGE_MESSAGES")) return
	if (!message.content) return

	let isAd = false
	let isScam = false;

	// currently only discord servers, can be expanded with more links later
	const advertising = [
		'discord.gg'
	]

	const scams = [
		'bit.ly/3k5Uc81',
		'discocrd-gift.com',
		'ttr-discord.com'
	]

	const whitelist = [
		'discord.gg/sN9YRQbBv7',
		'discord.gg/Tqtwtgh',
		'discord.gg/qVeDfZw',
		'discord.gg/rFBbYJYC2N',
		'discord.gg/KSEhCVtg4J',
		'discord.gg/rpCyfKV',
		'discord.gg/minecraft',
		'discord.gg/minecraftdungeons',
		'discord.gg/OptiFine'
	]

	if (advertising.some(a => message.content.includes(a))) isAd = true;
	if (scams.some(s => message.content.includes(s))) isScam = true;

	if (whitelist.some(w => message.content.includes(w))) return;

	let embed = new MessageEmbed()
		.setColor(settings.colors.red)
		.setDescription(`[Jump to message](${message.url})\n\n**Channel**: <#${message.channel.id}>\n**Server**: \`${message.guild}\`\n**User ID**: \`${message.author.id}\`\n**Date**: \`${message.createdAt.toLocaleString()}\`\n\n\`\`\`${message.content}\`\`\``)
		.setTimestamp()

	const authorName = (message.author.discriminator == 0)
		? `@${message.author.username}`
		: message.author.tag

	if (isScam) {
		embed.setAuthor(`${authorName} may be trying to scam users`, message.author.displayAvatarURL());
		await message.delete();
	} else if (isAd) {
		embed.setAuthor(`${authorName} may have advertised a discord server`, message.author.displayAvatarURL());
	} else return;

	client.channels.cache.get(settings.channels.link_detection).send({ embeds: [embed] })
}

exports.inviteDetection = inviteDetection