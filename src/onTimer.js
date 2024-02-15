const config = require('./config');
const s3Helper = require('./s3-helper');
const tgBot = require('./tgBot');
const path = require('path');
const stats = require('./stats');
const fs = require('fs');

const getGetChatKey = (chat) => {
  const currentTime = new Date().getTime();
  const chatId = chat.id._serialized;
  return path.join('group', chatId, 'metadata', `chat-${currentTime}.json`);
};

const getGetProfilesKey = (profile) => {
  const currentTime = new Date().getTime();
  return path.join(
    'profiles',
    `sim`,
    `${config.phoneConfig.sim}`,
    `profile`,
    `${profile.id._serialized}-${currentTime}.json`
  );
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

  for (const profile of profiles) {
    await s3Helper.saveToS3(
      getGetProfilesKey(profile),
      config.bucketName,
      JSON.stringify({
        eventName: 'got_profile',
        profile,
      })
    );
  }
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
  //getChats()
  setTimeout(async () => {
    await getChats(client);
    setInterval(async () => {
      await getChats(client);
    }, config.getChatsTimerIntervalMs);
  }, config.getChatsTimerDelayMs);
  tgBot.sendMessage(
    `GetChats() timer delay is ${config.getChatsTimerDelayMs}ms, Interval is ${config.getChatsTimerIntervalMs}ms`
  );

  //getProfiles()
  setTimeout(async () => {
    await getProfiles(client.pupPage);
    setInterval(async () => {
      getProfiles(client.pupPage);
    }, config.getProfilesTimerIntervalMs);
  }, config.getProfilesTimerDelayMs);
  tgBot.sendMessage(
    `getProfiles() timer delay is ${config.getProfilesTimerDelayMs}ms, Interval is ${config.getProfilesTimerIntervalMs}ms`
  );

  //send statistics
  setInterval(() => {
    const statistics = stats.getStats();
    tgBot.sendMessage(`ByDate stats:\n\n${JSON.stringify(statistics.statsCollectionByDate)}`);
    tgBot.sendMessage(`Total stats:\n\n${JSON.stringify(statistics.statsCollectionTotal)}`);
  }, 24 * 60 * 60 * 1000); //report every 24 hours

  // //recycle process everyday at 4:30 AM (pm2 will reload it)
  // setTimeout(() => {
  //   const interval = setInterval(async () => {
  //     const now = new Date();
  //     const hr = config.recycleTime.hr;
  //     const mn = config.recycleTime.mn;

  //     //check if its 4:30 AM: (or 4:31)
  //     if (now.getHours() === hr && (now.getMinutes() === mn || now.getMinutes() === mn + 1)) {
  //       clearInterval(interval);
  //       await tgBot.sendMessage(`Recycling on ${hr}:${mn}\ncalling process.exit()\n${config.waAccountDescription}`);
  //       process.exit(0);
  //     }
  //   }, 1 * 60 * 1000); //every minute:
  // }, 10 * 60 * 1000); //delay 10 minutes after start to be very sure its never going to show 4:30 again
};

module.exports = { setup };
