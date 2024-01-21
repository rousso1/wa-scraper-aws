const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

const tgBot = new TelegramBot(config.tgBotToken);

const sendPhoto = async (imageBuffer, caption = '') => {
  return tgBot.sendPhoto(config.tgAdminChatId, imageBuffer, {
    caption,
  });
};

const sendMessage = async (message) => {
  return tgBot.sendMessage(config.tgAdminChatId, message);
};

module.exports = { sendPhoto, sendMessage };
