import { version } from '../../package.json';
import { Router } from 'express';
import root from './root';
import TelegramBot from 'node-telegram-bot-api';
import { extractLink, validURL, isPhoto, extractGripe, validURLGripe, sleep } from '../lib/util';
import download from 'download';
import _ from 'lodash';

export default () => {
	let bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true, filepath: false});
	let api = Router();
	// let xray = Xray();
	api.use((req, res, next) => {
    next();
	});
	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	api.use('/root', root);

	bot.onText(/\/gripe (.+)/, async (msg, match) => {
		const chatId = msg.chat.id;
		const resp = match[1];

		try {
			console.log('downloading from gripe');
			let isValid = validURLGripe(resp);
			if (!isValid) {
				throw Error('Invalid url');
			}
			const links = await extractGripe(resp);
			if (links.length > 19) {
				bot.sendMessage(chatId, 'Begin downloading, please be patient');
				for (const i in links) {
					download(links[i].media).then(async (image) => {
						bot.sendDocument(chatId, image, {}, {
							filename: links[i].filename.replace(/\.[^/.]+$/, '')
						});
					});
				}
			} else {
				bot.sendMessage(chatId, 'Begin downloading, please be patient');
				for (const i in links) {
					download(links[i].media).then((image) => {
						bot.sendDocument(chatId, image, {}, {
							filename: links[i].filename.replace(/\.[^/.]+$/, '')
						});
					});
				}
			}

		} catch (error) {
			bot.sendMessage(chatId, error.message);
		}
	});

	bot.onText(/\/get (.+)/, async (msg, match) => {
		const chatId = msg.chat.id;
		const resp = match[1];

		try {
			console.log('downloading from cyberdrop');
			let isValid = validURL(resp);
			if (!isValid) {
				throw Error('Invalid url');
			}
			
			const links = await extractLink(resp);

			if (links.length > 19) {
				bot.sendMessage(chatId, 'Begin downloading, please be patient');
				for (const i in links) {
					download(links[i].media).then(async (image) => {
						bot.sendDocument(chatId, image, {}, {
							filename: links[i].filename.replace(/\.[^/.]+$/, '')
						});
					});
				}
			} else {
				bot.sendMessage(chatId, 'Begin downloading, please be patient');
				for (const i in links) {
					download(links[i].media).then((image) => {
						bot.sendDocument(chatId, image, {}, {
							filename: links[i].filename.replace(/\.[^/.]+$/, '')
						});
					});
				}
			}
		} catch (error) {
			bot.sendMessage(chatId, error.message);
		}
	});


	bot.onText(/\/mini (.+)/, async (msg, match) => {
		const chatId = msg.chat.id;
		const resp = match[1];
		try {
			let isValid = validURL(resp);
			if (!isValid) {
				throw Error('Invalid url');
			}
			const links = await extractLink(resp);
			bot.sendMessage(chatId, 'Begin downloading, please be patient');
			for (const i in links) {
				links[i].type = isPhoto ? 'photo' : 'video';
			}
			let media = {
				data: _.chunk(links, 10)
			};
			for(const i in media.data) {
				bot.sendMediaGroup(chatId, media.data[i]);
			}
		} catch (error) {
			bot.sendMessage(chatId, error.message);
		}
	});

	bot.onText(/\/help/, async (msg) => {
		const chatId = msg.chat.id;
		try {
			bot.sendMessage(chatId, `Commands: 
			/get <url> - Download cyberdrop album.
			/gripe <url> - Download dmca gripe album. 👷‍ BETA
			/mini <url> - Compressed grouped images. Buggy AF.
			`);
						
		} catch (error) {
			bot.sendMessage(chatId, error.message);
		}
	});

	return api;
};
