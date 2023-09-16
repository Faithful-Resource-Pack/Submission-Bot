const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const { hasPermission } = require("@helpers/permissions");
const formattedDate = require("@helpers/formattedDate");
const pushTextures = require("@submission/pushTextures");
const { downloadResults } = require("@submission/downloadResults");
const warnUser = require("@helpers/warnUser");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("autopush")
		.setDescription(strings.command.description.autopush)
		.addStringOption((option) =>
			option
				.setName("pack")
				.setDescription("Which pack to push.")
				.addChoices(
					{ name: "All", value: "all" },
					{ name: "Faithful 32x", value: "faithful_32x" },
					{ name: "Faithful 64x", value: "faithful_64x" },
					{ name: "Classic Faithful 32x Jappa", value: "classic_faithful_32x" },
					{ name: "Classic Faithful 32x Programmer Art", value: "classic_faithful_32x_progart" },
					{ name: "Classic Faithful 64x", value: "classic_faithful_64x" },
				)
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		if (!hasPermission(interaction.member, "administrator"))
			return warnUser(interaction, strings.command.no_permission);

		const choice = interaction.options.getString("pack", true);

		/** @type {import("@helpers/jsdoc").SubmissionPack[]} */
		const packs =
			choice == "all"
				? Object.values(settings.submission.packs)
				: [settings.submission.packs[choice]];

		const infoEmbed = new EmbedBuilder()
			.setDescription("This can take some time, please wait...")
			.setThumbnail(settings.images.loading)
			.setColor(settings.colors.blue);

		await interaction.reply({
			embeds: [infoEmbed.setTitle("Downloading textures...")],
			ephemeral: true,
		});
		for (const pack of packs) await downloadResults(interaction.client, pack.channels.results);

		await interaction.editReply({
			embeds: [infoEmbed.setTitle("Pushing textures...")],
			ephemeral: true,
		});

		await pushTextures(
			`Manual push executed by ${interaction.user.username} on ${formattedDate()}`,
		); // Push them through GitHub

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Successfully pushed all textures")
					.setColor(settings.colors.blue),
			],
			ephemeral: true,
		});
	},
};
