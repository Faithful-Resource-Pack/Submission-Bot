const { createCanvas, loadImage } = require("@napi-rs/canvas");
const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const getDimensions = require("@images/getDimensions");

const COOLORS_URL = "https://coolors.co/";

const COLORS_PER_PALETTE = 9;
const COLORS_PER_PALETTE_LINE = 3;
const COLORS_TOP = COLORS_PER_PALETTE * 6;

const GRADIENT_TOP = 250;
const GRADIENT_SAT_THRESHOLD = 15 / 100;
const GRADIENT_HUE_DIFF = 13 / 100;
const GRADIENT_WIDTH = 700;
const GRADIENT_BAND_WIDTH = 3;
const GRADIENT_HEIGHT = 50;

/**
 * Sends an ephemeral message with the palette of a given image url
 * @author Juknum, Evorp
 * @param {import("discord.js").MessageComponentInteraction} interaction discord interaction to respond to
 * @param {String} url Image URL
 */
module.exports = async function palette(interaction, url) {
	const dimension = await getDimensions(url);

	if (dimension.width * dimension.height > 262144)
		return await interaction.reply({
			content: strings.command.image.input_too_big,
			ephemeral: true,
		});

	const canvas = createCanvas(dimension.width, dimension.height).getContext("2d");
	const allColors = {};

	const temp = await loadImage(url);
	canvas.drawImage(temp, 0, 0);

	const imageData = canvas.getImageData(0, 0, dimension.width, dimension.height).data;

	let x, y;

	for (x = 0; x < dimension.width; ++x) {
		for (y = 0; y < dimension.height; ++y) {
			let index = (y * dimension.width + x) * 4;
			let r = imageData[index];
			let g = imageData[index + 1];
			let b = imageData[index + 2];
			let a = imageData[index + 3] / 255;

			// avoid transparent colors
			if (!a) continue;

			let hex = rgbToHex(r, g, b);
			if (!(hex in allColors)) allColors[hex] = { hex: hex, opacity: [], rgb: [r, g, b], count: 0 };

			++allColors[hex].count;
			allColors[hex].opacity.push(a);
		}
	}

	// convert back to array
	let colors = Object.values(allColors)
		.sort((a, b) => b.count - a.count)
		.slice(0, COLORS_TOP)
		.map((el) => el.hex);

	// stupid workaround for djs v14 not letting you query embed property lengths?
	let description = `List of colors:\n`;

	const embed = new EmbedBuilder()
		.setTitle("Palette results")
		.setColor(settings.colors.blue)
		.setDescription(description)
		.setFooter({ text: `Total: ${Object.values(allColors).length}` });

	const fieldGroups = [];
	let group;
	for (let i = 0; i < colors.length; ++i) {
		// create 9 group
		if (i % COLORS_PER_PALETTE === 0) {
			fieldGroups.push([]);
			group = 0;
		}

		// each groups has 3 lines
		if (group % COLORS_PER_PALETTE_LINE === 0) fieldGroups[fieldGroups.length - 1].push([]);

		// add color to latest group latest line
		fieldGroups[fieldGroups.length - 1][fieldGroups[fieldGroups.length - 1].length - 1].push(
			colors[i],
		);
		++group;
	}

	fieldGroups.forEach((group, index) => {
		const groupValue = group
			.map((line) =>
				line.map((color) => `[\`${color}\`](${COOLORS_URL}${color.replace("#", "")})`).join(" "),
			)
			.join(" ");
		embed.addFields({
			name: "Hex" + (fieldGroups.length > 1 ? ` part ${index + 1}` : "") + ": ",
			value: groupValue,
			inline: true,
		});
	});

	// create palette links, 9 max per link
	// make arrays of hex arrays
	const paletteGroups = [];
	for (let i = 0; i < colors.length; ++i) {
		if (i % COLORS_PER_PALETTE === 0) paletteGroups.push([]);
		paletteGroups[paletteGroups.length - 1].push(colors[i].replace("#", ""));
	}

	// create urls
	const paletteUrls = [];
	let descriptionLength = description.length;

	for (let i = 0; i < paletteGroups.length; ++i) {
		const link = `**[Palette${
			paletteGroups.length > 1 ? " part " + (i + 1) : ""
		}](${COOLORS_URL}${paletteGroups[i].join("-")})** `;

		// too long
		if (descriptionLength + link.length + 3 > 1024) break;

		paletteUrls.push(link);
		descriptionLength += link.length;
	}

	// append palette links to existing description
	description += paletteUrls.join(" - ");
	embed.setDescription(description);

	// create gradient canvas for top GRADIENT_TOP colors
	const bandWidth =
		Object.values(allColors).length > GRADIENT_TOP
			? GRADIENT_BAND_WIDTH
			: Math.floor(GRADIENT_WIDTH / Object.values(allColors).length);

	// compute width
	const allColorsSorted = Object.values(allColors)
		.sort((a, b) => b.count - a.count)
		.slice(0, GRADIENT_TOP)
		.sort((a, b) => {
			let [ha, sa, la] = rgbToHsl(a.rgb[0], a.rgb[1], a.rgb[2]);
			let [hb, sb, lb] = rgbToHsl(b.rgb[0], b.rgb[1], b.rgb[2]);

			if (sa <= GRADIENT_SAT_THRESHOLD && sb > GRADIENT_SAT_THRESHOLD) return -1;
			else if (sa > GRADIENT_SAT_THRESHOLD && sb <= GRADIENT_SAT_THRESHOLD) return 1;
			else if (sa <= GRADIENT_SAT_THRESHOLD && sb <= GRADIENT_SAT_THRESHOLD) {
				return la > lb ? 1 : -(la < lb);
			} else if (Math.abs(ha - hb) > GRADIENT_HUE_DIFF) return ha > hb ? 1 : -(ha < hb);
			return la > lb ? 1 : -(la < lb);
		});

	const canvasWidth = bandWidth * allColorsSorted.length;
	const colorCanvas = createCanvas(canvasWidth, GRADIENT_HEIGHT);
	const ctx = colorCanvas.getContext("2d");

	allColorsSorted.forEach((color, index) => {
		ctx.fillStyle = color.hex;
		ctx.globalAlpha = color.opacity.reduce((a, v, i) => (a * i + v) / (i + 1)); // average alpha
		ctx.fillRect(bandWidth * index, 0, bandWidth, GRADIENT_HEIGHT);
	});

	// create the attachement
	const colorImageAttachment = new AttachmentBuilder(colorCanvas.toBuffer("image/png"), {
		name: "colors.png",
	});

	return await interaction.reply({
		embeds: [embed],
		files: [colorImageAttachment],
		ephemeral: true,
	});
};

function rgbToHex(r, g, b) {
	return (
		"#" +
		((r | (1 << 8)).toString(16).slice(1) +
			(g | (1 << 8)).toString(16).slice(1) +
			(b | (1 << 8)).toString(16).slice(1))
	);
}

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param {Number} r The red color value
 * @param {Number} g The green color value
 * @param {Number} b The blue color value
 * @return {Number[]} The HSL representation
 */
function rgbToHsl(r, g, b) {
	(r /= 255), (g /= 255), (b /= 255);

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const diff = max - min;

	let h;
	let s;
	let l = (max + min) / 2;

	// all color channels are equal so it's grayscale
	if (!diff) h = s = 0;
	else {
		s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

		switch (max) {
			case r:
				h = (g - b) / diff + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / diff + 2;
				break;
			case b:
				h = (r - g) / diff + 4;
				break;
		}

		h /= 6;
	}

	return [h, s, l];
}
