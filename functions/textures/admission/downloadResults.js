const { getMessages } = require('../../../helpers/getMessages')

const settings = require('../../../resources/settings.json')

const texturesCollection = require('../../../helpers/firestorm/texture')
const contributionsCollection = require('../../../helpers/firestorm/contributions')

const fs = require('fs')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

var Buffer = require('buffer/').Buffer

/**
 * Download textures from the given text channel
 * @author Juknum
 * @param {DiscordClient} client
 * @param {String} channelInID discord text channel from where the bot should download texture
 */
async function downloadResults(client, channelInID) {
	let messages = await getMessages(client, channelInID)

	let repo_key = null; // idk what's the best initial value
	for (let repoName in settings.submission) {
		if (settings.submission[repoName].channels.results == channelInID) {
		    repo_key = repoName;
		    break;
		}
	  }

	// get messages from the same day
	let delayedDate = new Date()
	messages = messages.filter(message => {
		let messageDate = new Date(message.createdTimestamp)
		return messageDate.getDate() == delayedDate.getDate() && messageDate.getMonth() == delayedDate.getMonth() && messageDate.getFullYear() == delayedDate.getFullYear()
	})

	// select non already processed messages
	messages = messages
		.filter(message => message.embeds.length > 0)
		.filter(message => message.embeds[0] && message.embeds[0].fields && message.embeds[0].fields[1])

	// keep good textures
	messages = messages
		.filter(message => message.embeds[0].fields[1] !== undefined && !message.embeds[0].fields[1].value.includes('will not be added'))

	messages.reverse() // upload them from the oldest to the newest

	// map the array for easier management
	let textures = messages.map(message => {
		return {
			url: message.embeds[0].image.url,
			authors: message.embeds[0].fields[0].value.split('\n').map(auth => auth.replace('<@!', '').replace('>', '')),
			date: message.createdTimestamp,
			id: message.embeds[0].title.split(' ').filter(el => el.charAt(0) === '[' && el.charAt(1) === '#' && el.slice(-1) == "]").map(el => el.slice(2, el.length - 1))[0]
		}
	})


	// for each texture:
	let allContribution = new Array()
	for (let i = 0; textures[i]; i++) {
		let textureID = textures[i].id
		let textureURL = textures[i].url
		let textureDate = textures[i].date
		let textureAuthors = textures[i].authors

		let texture = await texturesCollection.get(textureID)
		let uses = await texture.uses()

		let allPaths = new Array()
		// get all paths of the texture
		for (let j = 0; uses[j]; j++) {
			let localPath = 'undef'
			switch (uses[j].editions[0].toLowerCase()) {
				case "java":
					localPath = './texturesPush/' + settings.repositories.repo_name.java[repo_key]
					break
				case "bedrock":
					localPath = './texturesPush/' +  + settings.repositories.repo_name.bedrock[repo_key];
					break
				default:
					break
			}

			let paths = await uses[j].paths()

			// for all paths
			for (let k = 0; paths[k]; k++) {
				let versions = paths[k].versions
				// for each version of each path
				for (let l = 0; versions[l]; l++) allPaths.push(`${localPath}/${versions[l]}/${paths[k].path}`)
			}
		}

		const response = await fetch(textureURL)
		const buffer = await response.arrayBuffer()

		// download the texture to all it's paths
		for (let j = 0; allPaths[j]; j++) {
			// create full folder path
			await fs.promises.mkdir(allPaths[j].substr(0, allPaths[j].lastIndexOf('/')), { recursive: true })
				.catch(err => { if (process.DEBUG) console.error(err) })

			// write texture to the corresponding path
			fs.writeFile(allPaths[j], Buffer.from(buffer), function (err) {
				if (err && process.DEBUG == "true") return console.error(err)
				else if (process.DEBUG == "true") return console.log(`ADDED TO: ${allPaths[j]}`)
			})
		}

		// prepare the authors for the texture:
		allContribution.push({
			date: textureDate,
			resolution: res,
			pack: res === 32 ? 'faithful_32x' : "faithful_64x",
			texture: `${textureID}`,
			authors: textureAuthors
		})
	}

	let result = await contributionsCollection.addBulk(allContribution)
	if (process.DEBUG) console.log('ADDED CONTRIBUTIONS: ' + result.join(' '))
}

exports.downloadResults = downloadResults