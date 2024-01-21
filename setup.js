const fs = require('fs');

const profileIdToSetup = 1;

const commonConfig = {
  GETCHATS_TIMER_INTERVAL_MINUTES: 1440,
  GETCHATS_TIMER_DELAY_MINUTES: 60,
  TELEGRAM_ADMIN_CHAT_ID: 285838698,
  SCRAPER_BUCKET_NAME: 'whatsapp-raw-entry-bucket',
  PREPROCESSING_QUEUE: 'whatsapp-preprocessing-queue',
  AWS_REGION: 'eu-central-1',
  AWS_PROFILE: 'default',
};

const profiles = {
  1: {
    SIM_NUMBER: '+972542197237',
    SIM_ID: 1,
    ACCOUNT_NAME: 'אבי פרץ',
    PHYSICAL_DEVICE: 'Redmi-F',
    DEVICE_ACCOUNT: 'Secondary',
    TELEGRAM_BOT_TOKEN: '6727438592:AAEd0PyZi5fl0ydbHmcaFuS7iQDxe7mwCFI', //@wa_watcher_bot
  },
  // 2: {
  //   SIM_NUMBER: '+972527750926',
  //   SIM_ID: 2,
  //   ACCOUNT_NAME: 'רחל חדד',
  //   PHYSICAL_DEVICE: 'XBX',
  //   DEVICE_ACCOUNT: 'Primary',
  //   TELEGRAM_BOT_TOKEN: '',
  // },
  3: {
    SIM_NUMBER: '+972542361874',
    SIM_ID: 3,
    ACCOUNT_NAME: 'משה אלבז',
    PHYSICAL_DEVICE: 'XBX',
    DEVICE_ACCOUNT: 'Secondary',
    TELEGRAM_BOT_TOKEN: '',
  },
  4: {
    SIM_NUMBER: '+972548938868',
    SIM_ID: 4,
    ACCOUNT_NAME: 'ליאל אלקסלסי המלכה',
    PHYSICAL_DEVICE: 'Blue',
    DEVICE_ACCOUNT: 'Primary',
    TELEGRAM_BOT_TOKEN: '',
  },
  5: {
    SIM_NUMBER: '+972506050146',
    SIM_ID: 5,
    ACCOUNT_NAME: 'אלירן אמסלם',
    PHYSICAL_DEVICE: 'Blue',
    DEVICE_ACCOUNT: 'Secondary',
    TELEGRAM_BOT_TOKEN: '',
  },
  29: {
    SIM_NUMBER: '+972506031635',
    SIM_ID: 29,
    ACCOUNT_NAME: 'אלי דוידי',
    PHYSICAL_DEVICE: '595-B',
    DEVICE_ACCOUNT: 'Primary',
    TELEGRAM_BOT_TOKEN: '',
  },
  25: {
    SIM_NUMBER: '+972547825615',
    SIM_ID: 25,
    ACCOUNT_NAME: 'علي',
    PHYSICAL_DEVICE: '595-B',
    DEVICE_ACCOUNT: 'Secondary',
    TELEGRAM_BOT_TOKEN: '',
  },
  33: {
    SIM_NUMBER: '+972502324730',
    SIM_ID: 33,
    ACCOUNT_NAME: 'זהבה',
    PHYSICAL_DEVICE: 'Redmi-F',
    DEVICE_ACCOUNT: 'Primary',
    TELEGRAM_BOT_TOKEN: '6883893523:AAFzefZNZlKx4Dz1X7s3C_ElSoTa71Lp8Lg', //@WatcherZehavaBot
  },
};

console.log(`setting up .env for ${profileIdToSetup}`);
const props = Object.assign(profiles[profileIdToSetup], commonConfig);
fs.writeFileSync(
  '.env',
  Object.entries(props)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        value = "'" + value + "'";
      }
      return [key, value].join('=');
    })
    .join('\n')
);
// const simsConfig = {
//   //PRO:
//   18: { sim: '+972547842778', device: 'X-413', account: 'Primary', name: 'הדס', profile: 'pro' },
//   23: { sim: '+972547674168', device: 'X-413', account: 'Secondary', name: 'ויקי', profile: 'pro' },
//   19: { sim: '+972547633496', device: 'A-843', account: 'Primary', name: 'אריאלה', profile: 'pro' }, //dead
//   20: { sim: '+972547839804', device: 'A-843', account: 'Secondary', name: 'עינת', profile: 'pro' },
//   // 22: { sim: '+972547660578', device: '595-B', account: 'Primary', name: 'גלית', profile: 'pro' },
//   // 21: { sim: '+972547847745', device: '595-B', account: 'Secondary', name: 'דפנה', profile: 'pro' },

const TelegramBot = require('node-telegram-bot-api');
const token = profiles[profileIdToSetup].TELEGRAM_BOT_TOKEN;
const tgBot = new TelegramBot(token, { polling: true });

tgBot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Log the received message
  console.log(`Received message from ${chatId}: ${msg.text}`);
});
