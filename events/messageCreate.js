const client = require('../index').Client
const lastMessages = require('../functions/lastMessages')

const { MessageEmbed } = require('discord.js');

const DEV = (process.env.DEV.toLowerCase() == 'true')
const MAINTENANCE = (process.env.MAINTENANCE.toLowerCase() == 'true')
const PREFIX = process.env.PREFIX
const UIDA = [
  process.env.UIDR,
  process.env.UIDD,
  process.env.UIDT,
  process.env.UIDJ
]

const strings = require('../resources/strings.json')
const settings = require('../resources/settings.json')

const { submitTexture } = require('../functions/textures/submission/submitTexture')
const { inviteDetection } = require('../functions/moderation/inviteDetection')
const { increase: increaseCommandProcessed } = require('../functions/commandProcess')

const { addDeleteReact } = require('../helpers/addDeleteReact')
const { warnUser } = require('../helpers/warnUser')

module.exports = {
  name: 'messageCreate',
  // eslint-disable-next-line no-unused-vars
  async execute(message) {
    // Ignore bot messages
    if (message.author.bot) return

    if (message.content.startsWith(PREFIX)) {
      if (MAINTENANCE && !UIDA.includes(message.author.id)) {
        const msg = await message.reply({ content: strings.command.maintenance })
        await message.react('❌')
        if (!message.deleted) setTimeout(() => msg.delete(), 30000);
      }

      const args = message.content.toLowerCase().slice(PREFIX.length).trim().split(/ +/)
      const commandName = args.shift().toLowerCase()
      const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))

      if (command.guildOnly && message.channel.type === 'DM') return warnUser(message, strings.bot.cant_dm)

      lastMessages.addMessage(message)

      command.execute(client, message, args).then(async () => {
        return increaseCommandProcessed()
      }).catch(async error => {
        console.trace(error)

        const embed = new MessageEmbed()
          .setColor(settings.colors.red)
          .setTitle(strings.bot.error)
          .setThumbnail(settings.images.error)
          .setDescription(`${strings.command.error}\nError for the developers:\n${error}`)

        let msgEmbed = await message.reply({ embeds: [embed] })
        await message.react('❌')
        return addDeleteReact(msgEmbed, message, true)
      })
    }

    else {
      if (DEV) return

      /**
       * DISCORD SERVER INVITE DETECTION
       * @warn I hope there is no other use of this link type on Discord
       * Found more information here: https://youtu.be/-51AfyMqnpI
       * @author RobertR11
       */
      inviteDetection(client, message)

      /**
       * TEXTURE SUBMISSION
       */
      if (
        message.channel.id === settings.channels.submit_textures.c32 ||
        message.channel.id === settings.channels.submit_textures.c64 || // OLD
        message.channel.id === '931887174977208370' ||
        message.channel.id === settings.channels.submit_textures.cdungeons
      ) return submitTexture(client, message)
    }
  }
}
