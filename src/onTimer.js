const config = require('./config');
const s3Helper = require('./s3-helper');
const tgBot = require('./tgBot');
const path = require('path');
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

const getProfiles = async (browser) => {
  const pages = await browser.pages();
  const waPage = pages[0];

  const profiles = await waPage.evaluate(async () => {
    const delayRandomTime = async (minTimeMs = 4000, maxTimeMs = 8000) => {
      const waitTime = maxTimeMs ? Math.round((maxTimeMs - minTimeMs) * Math.random() + minTimeMs) : minTimeMs;
      console.log(`waiting ${waitTime / 1000} seconds...`);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(waitTime);
        }, waitTime);
      });
    };

    const getToDataUrlParams = (imgSrc) => {
      const url = new URL(imgSrc);
      const pathNameArr = url.pathname.split('.');
      const extName = pathNameArr.pop();
      switch (extName) {
        case 'jpg':
          return ['image/jpeg', 1.0];
        case 'webp':
          return ['image/webp', 1.0];
        default:
          return ['image/png', 1.0];
      }
    };

    const getBase64Image = async (imgSrc) => {
      const img = new Image();

      img.crossOrigin = 'anonymous';
      img.src = imgSrc;
      await new Promise((imgResolve, imgReject) => {
        img.onload = imgResolve;
        img.onerror = imgReject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Get the base64 representation of the image
      const params = getToDataUrlParams(imgSrc);
      const base64String = canvas.toDataURL(params[0], params[1]);
      return base64String;
    };

    const results = window.Store.Contact._models
      .filter((model) => {
        return model.attributes?.pushname || model.attributes?.profilePicThumb?.attributes?.eurl;
      })
      .map((model) => {
        const id = model.id;
        const picSrc = model.attributes?.profilePicThumb?.attributes?.eurl;
        const pushname = model.attributes?.pushname;
        const result = {
          id,
        };

        if (picSrc) {
          result.picSrc = picSrc;
        }

        if (pushname) {
          result.pushname = pushname;
        }

        return result;
      });

    const resultsWithPictures = results.filter((result) => result.picSrc);

    for (const resWithPic of resultsWithPictures) {
      await delayRandomTime();
      resWithPic.picBase64 = await getBase64Image(resWithPic.picSrc);
    }

    return results;
  });

  // fs.writeFileSync(`./profiles-${new Date().getTime()}.json`, JSON.stringify(profiles), { encoding: 'utf-8' });

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
    await getProfiles(client.pupBrowser);
    setInterval(async () => {
      getProfiles(client.pupBrowser);
    }, config.getProfilesTimerIntervalMs);
  }, config.getProfilesTimerDelayMs);
  tgBot.sendMessage(
    `getProfiles() timer delay is ${config.getProfilesTimerDelayMs}ms, Interval is ${config.getProfilesTimerIntervalMs}ms`
  );
};

module.exports = { setup };
