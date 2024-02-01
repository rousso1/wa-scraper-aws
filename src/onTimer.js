const config = require('./config');
const s3Helper = require('./s3-helper');
const tgBot = require('./tgBot');
const path = require('path');
const stats = require('./stats');
// const fs = require('fs'); //TODO: remove

const getGetChatKey = (chat) => {
  const currentTime = new Date().getTime();
  const chatId = chat.id._serialized;
  return path.join('group', chatId, 'metadata', `chat-${currentTime}.json`);
};

const getGetProfilesKey = () => {
  const currentTime = new Date().getTime();
  return path.join('profiles', `profiles-${config.phoneConfig.sim}-${currentTime}.json`);
};

// const getGropuPictureBase64 = async (groupId, waPage) => {
//   const result = await waPage.evaluate(async (groupId) => {
//     const chatWid = window.Store.WidFactory.createWid(groupId);
//     return await window.WWebJS.getProfilePicThumbToBase64(chatWid);
//   }, groupId);

//   return result;
// };

const getProfiles = async (waPage) => {
  const profiles = await waPage.evaluate(async () => {
    const results = window.Store.Contact._models
      .filter((model) => {
        return model.attributes?.pushname;
      })
      .map((model) => {
        return {
          id: model.id,
          pushname: model.attributes?.pushname,
        };
      });

    return results;
  });

  await s3Helper.saveToS3(
    getGetProfilesKey(),
    config.bucketName,
    JSON.stringify({
      eventName: 'get_profiles',
      profiles,
    })
  );
};

const getChats = async (client) => {
  const chats = await client.getChats();
  for (const chat of chats) {
    const key = getGetChatKey(chat);
    // chat.groupPicture = await getGropuPictureBase64(chat.id._serialized, client.pupPage);
    chat.eventName = 'get_chats';
    await s3Helper.saveToS3(key, config.bucketName, JSON.stringify(chat));
    console.log(`saved ${config.bucketName}/${key}`);
  }
  tgBot.sendMessage(`finished getChats(), got ${chats.length} chats`);
};

const setup = (client) => {
  setTimeout(async () => {
    await getChats(client);
    setInterval(async () => {
      await getChats(client);
    }, config.getChatsTimerIntervalMs);
  }, config.getChatsTimerDelayMs);
  tgBot.sendMessage(
    `GetChats() timer delay is ${config.getChatsTimerDelayMs}ms, Interval is ${config.getChatsTimerIntervalMs}ms`
  );

  setTimeout(async () => {
    await getProfiles(client.pupPage);
    setInterval(async () => {
      getProfiles(client.pupPage);
    }, config.getProfilesTimerIntervalMs);
  }, config.getProfilesTimerDelayMs);
  tgBot.sendMessage(
    `getProfiles() timer delay is ${config.getProfilesTimerDelayMs}ms, Interval is ${config.getProfilesTimerIntervalMs}ms`
  );

  setInterval(() => {
    const statistics = stats.getStats();
    tgBot.sendMessage(`Yesterday stats:\n\n${JSON.stringify(statistics.yesterday)}`);
    tgBot.sendMessage(`Total stats:\n\n${JSON.stringify(statistics.statsCollectionTotal)}`);
  }, 24 * 60 * 60 * 1000);
};

module.exports = { setup };
