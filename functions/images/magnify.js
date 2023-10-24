const { createCanvas, loadImage, Image } = require("@napi-rs/canvas");

const { AttachmentBuilder } = require("discord.js");

/**
 * The actual magnification function
 * @author Juknum, Evorp
 * @param {import("@helpers/jsdoc").ImageSource} origin any loadable image
 * @param {boolean} isAnimation whether to magnify the image as a tilesheet
 * @returns {Promise<{ magnified: Buffer, width: number, height: number, factor: number }>} buffer for magnified image
 */
async function magnify(origin, isAnimation = false) {
	const input = await loadImage(origin);

	// ignore height if tilesheet, otherwise it's not scaled as much
	const surface = isAnimation ? input.width * 16 : input.width * input.height;

	let factor = 64;
	if (surface == 256) factor = 32;
	if (surface > 256) factor = 16;
	if (surface > 1024) factor = 8;
	if (surface > 4096) factor = 4;
	if (surface > 65536) factor = 2;
	if (surface > 262144) factor = 1;

	const width = input.width * factor;
	const height = input.height * factor;
	const output = createCanvas(width, height);
	const ctx = output.getContext("2d");

	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(input, 0, 0, width, height);
	return { magnified: output.toBuffer("image/png"), width, height, factor };
}

/**
 * Returns discord attachment
 * @author Juknum
 * @param {import("@helpers/jsdoc").ImageSource} origin any loadable image
 * @param {string} name name, defaults to "magnified.png"
 * @returns {Promise<AttachmentBuilder>} magnified file
 */
async function magnifyToAttachment(origin, name = "magnified.png") {
	const { magnified } = await magnify(origin);
	return new AttachmentBuilder(magnified, { name });
}

module.exports = {
	magnify,
	magnifyToAttachment,
};
