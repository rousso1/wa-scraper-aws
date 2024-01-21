const config = require('./config');
const s3Helper = require('./s3-helper');
const tgBot = require('./tgBot');
const path = require('path');

const getGetChatKey = (chat) => {
  const currentTime = new Date().getTime();
  const chatId = chat.id._serialized;
  return path.join('group', chatId, 'metadata', `chat-${currentTime}.json`);
};

const getChats = async (client) => {
  const chats = await client.getChats();
  for (const chat of chats) {
    const key = getGetChatKey(chat);
    await s3Helper.saveToS3(key, config.bucketName, JSON.stringify(chat));
    console.log(`saved ${config.bucketName}/${key}`);
  }
  tgBot.sendMessage(`finished getChats(), got ${chats.length} chats`);
};

const setup = (client) => {
  setTimeout(() => {
    getChats(client);
    setInterval(() => {
      getChats(client);
    }, config.timerIntervalMs);
  }, config.timerDelayMs);
  tgBot.sendMessage(`Timer delay is ${config.timerDelayMs}ms, Interval is ${config.timerIntervalMs}ms`);
};

module.exports = { setup };
