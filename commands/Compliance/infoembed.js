const prefix = process.env.PREFIX;

const settings = require('../../resources/settings.json')
const strings = require('../../resources/strings.json')

const { MessageEmbed } = require('discord.js')
const { warnUser } = require('../../helpers/warnUser')
const { Permissions } = require('discord.js');

module.exports = {
	name: 'infoembed',
	description: strings.command.description.infoembed,
	category: 'Compliance',
	guildOnly: true,
	uses: strings.command.use.devs,
	syntax: `${prefix}discords\n${prefix}media`,
	async execute(client, message, args) {
		if (message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
			if (args[0] === 'discords') {
				if (message.guild.id === settings.guilds.c32.id || args[1] === 'main') {
					await message.channel.send({ content: `
**Permanent Invite Link**:

https://discord.gg/sN9YRQbBv7

**Classic Faithful:**

https://discord.gg/KSEhCVtg4J

**Minecraft:**

https://discord.gg/minecraft
					` });
					await message.delete()
				}

				else if (message.guild.id === settings.guilds.em.id || args[1] === 'cf') {
					await message.channel.send({ content: `
**Permanent Invite Link**:

https://discord.gg/KSEhCVtg4J

**Main Server:**

https://discord.gg/sN9YRQbBv7

**Minecraft:**

https://discord.gg/minecraft
					`})
					await message.delete()
				}

				else return warnUser(message, 'You must specify a third argument. Available options are `main` and `cf`.')
			}

			else if (args[0] === 'media') {
				const f32Embed = new MessageEmbed()
					.setTitle('Faithful 32x:') // these should probably be strings in the db but I'm too lazy to add it
					.setDescription (`
[Website](https://faithfulpack.net/faithful32x/latest)

[Java Edition CurseForge](https://curseforge.com/minecraft/texture-packs/faithful-32x)

[Bedrock Edition CurseForge](https://www.curseforge.com/minecraft-bedrock/addons/faithful-32x-bedrock)

[Modrinth](https://modrinth.com/resourcepack/faithful-32x)

[MCPEDL](https://mcpedl.com/faithful-32x/)

[Planet Minecraft](https://planetminecraft.com/texture-pack/faithful-32x/)

[Java Edition GitHub](https://github.com/faithful-resource-pack/faithful-java-32x)

[Bedrock Edition GitHub](https://github.com/faithful-resource-pack/faithful-bedrock-32x)
					`)
					.setColor(0x00a2ff) // sorry for hardcoded colors but idk where these are stored in the db or if cf ones even exist so this is just easier
					.setThumbnail('https://database.faithfulpack.net/images/branding/logos/transparent/512/f32_logo.png')

				const f64Embed = new MessageEmbed()
					.setTitle('Faithful 64x:')
					.setDescription (`
[Website](https://faithfulpack.net/faithful64x/latest)

[Java Edition CurseForge](https://curseforge.com/minecraft/texture-packs/faithful-64x)

[Bedrock Edition CurseForge](https://www.curseforge.com/minecraft-bedrock/addons/faithful-64x-bedrock)

[Modrinth](https://modrinth.com/resourcepack/faithful-64x)

[Planet Minecraft](https://planetminecraft.com/texture-pack/faithful-64x/)

[Java Edition GitHub](https://github.com/faithful-resource-pack/faithful-java-64x)

[Bedrock Edition GitHub](https://github.com/faithful-resource-pack/faithful-bedrock-64x)
					`)
					.setColor(0xd8158d)
					.setThumbnail('https://database.faithfulpack.net/images/branding/logos/transparent/512/f64_logo.png')

				const cf32jEmbed = new MessageEmbed()
					.setTitle('Classic Faithful 32x Jappa:')
					.setDescription (`
[Website](https://faithfulpack.net/classicfaithful/32x-jappa)

[CurseForge](https://curseforge.com/minecraft/texture-packs/classic-faithful-32x-jappa)

[Planet Minecraft](https://planetminecraft.com/texture-pack/classic-faithful-32x)

[Java Edition GitHub](https://github.com/classicfaithful/32x-jappa)

[Bedrock Edition GitHub](https://github.com/classicfaithful/32x-jappa-bedrock)

[Add-ons GitHub](https://github.com/classicfaithful/32x-jappa-add-ons)
					`)
					.setColor(0x00c756)
					.setThumbnail('https://database.faithfulpack.net/images/branding/logos/transparent/512/cf32_logo.png')

				const cf32paEmbed = new MessageEmbed()
					.setTitle('Classic Faithful 32x PA:')
					.setDescription (`
[Website](https://faithfulpack.net/classicfaithful/32x-programmer-art)

[CurseForge](https://curseforge.com/minecraft/texture-packs/classic-faithful-32x-pa)

[Planet Minecraft](https://planetminecraft.com/texture-pack/classic-faithful-32x-pa)

[Java Edition GitHub](https://github.com/classicfaithful/32x-programmer-art)

[Bedrock Edition GitHub](https://github.com/classicfaithful/32x-programmer-art-bedrock)

[Add-ons GitHub](https://github.com/classicfaithful/32x-programmer-art-add-ons)
					`)
					.setColor(0xa1db12)
					.setThumbnail('https://database.faithfulpack.net/images/branding/logos/transparent/512/cf32pa_logo.png')

				const cf64jEmbed = new MessageEmbed()
					.setTitle('Classic Faithful 64x:')
					.setDescription (`
[Website](https://faithfulpack.net/classicfaithful/64x-jappa)

[CurseForge](https://curseforge.com/minecraft/texture-packs/classic-faithful-64x)

[Planet Minecraft](https://planetminecraft.com/texture-pack/classic-faithful-64x/)

[Java Edition GitHub](https://github.com/classicfaithful/64x-jappa)

[Bedrock Edition GitHub](https://github.com/classicfaithful/64x-jappa-bedrock)
					`)
					.setColor(0x9f00cf)
					.setThumbnail('https://database.faithfulpack.net/images/branding/logos/transparent/512/cf64_logo.png')

				// project nonspecific stuff goes here
				const generalEmbed = new MessageEmbed()
					.setTitle('Useful Links:')
					.setDescription (`
**General:**

[Website](https://faithfulpack.net/) • [Docs](https://docs.faithfulpack.net/) • [News](https://faithfulpack.net/news) • [License](https://faithfulpack.net/license) • [Translate](https://translate.faithfulpack.net/)

**Listings:**

[CurseForge](https://curseforge.com/members/faithful_resource_pack/projects) • [Modrinth](https://modrinth.com/user/faithful-resource-pack) • [Planet Minecraft](https://planetminecraft.com/member/faithful_resource_pack/) • [MCPEDL](https://mcpedl.com/user/faithful-resource-pack/) • [Minecraft Forum](https://www.minecraftforum.net/members/faithful_resource_pack)

**Media:**

[Twitter](https://twitter.com/faithfulpack/) • [Patreon](https://www.patreon.com/faithful_resource_pack) • [Reddit](https://reddit.com/r/faithfulpack/) • [Main GitHub](https://github.com/faithful-resource-pack/) • [Classic Faithful GitHub](https://github.com/classicfaithful/)
					`)
					.setColor(settings.colors.c32)
					.setThumbnail('https://database.faithfulpack.net/images/branding/logos/transparent/512/plain_logo.png')
					.setFooter (
						text='Listings for specific packs can be found above.',
						iconURL='https://database.faithfulpack.net/images/branding/logos/transparent/512/plain_logo.png'
					)

				await message.channel.send({ embeds: [f32Embed, f64Embed, cf32jEmbed, cf32paEmbed, cf64jEmbed, generalEmbed] })
				await message.delete()
			} else return warnUser(message, 'You must specify a second argument. Available options are `discords` and `media`.')
		} else return warnUser(message, "Only Managers can do that!")
	}
};
