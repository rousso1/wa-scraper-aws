require('dotenv').config();

(() => {
  const missingVars = [
    'SIM_NUMBER',
    'SIM_ID',
    'ACCOUNT_NAME',
    'PHYSICAL_DEVICE',
    'DEVICE_ACCOUNT',
    'GETCHATS_TIMER_INTERVAL_MINUTES',
    'GETCHATS_TIMER_DELAY_MINUTES',
    'GETPROFILES_TIMER_INTERVAL_MINUTES',
    'GETPROFILES_TIMER_DELAY_MINUTES',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_ADMIN_CHAT_ID',
    'SCRAPER_BUCKET_NAME',
    'DAILY_RECYCLE_TIME',
    'NEO4J_URI',
    'NEO4J_USERNAME',
    'NEO4J_PASSWORD',
  ].filter((envVar) => typeof process.env[envVar] === 'undefined');

  if (missingVars.length) {
    console.log(`missing process.env variables: ${JSON.stringify(missingVars)}`);
    process.exit(1);
  }
})();

const phoneConfig = {
  sim: process.env.SIM_NUMBER,
  simId: parseInt(process.env.SIM_ID, 10),
  device: process.env.PHYSICAL_DEVICE,
  account: process.env.DEVICE_ACCOUNT,
  name: process.env.ACCOUNT_NAME,
};

if (isNaN(phoneConfig.simId)) {
  console.log(`couldnt read process.env.SIM_ID`);
  process.exit(1);
}

const deployedOnUbuntu = process.cwd().startsWith('/home/ubuntu/');

const puppeteerConfig = deployedOnUbuntu
  ? {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
      executablePath: '/usr/bin/google-chrome-stable',
    }
  : {
      headless: false,
      defaultViewport: null,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    };

const [hr, mn] = process.env.DAILY_RECYCLE_TIME.split(':').map(parseFloat);

module.exports = {
  getChatsTimerIntervalMs: Math.round(parseFloat(process.env.GETCHATS_TIMER_INTERVAL_MINUTES) * 60 * 1000),
  getChatsTimerDelayMs: Math.round(parseFloat(process.env.GETCHATS_TIMER_DELAY_MINUTES) * 60 * 1000),
  getProfilesTimerIntervalMs: Math.round(parseFloat(process.env.GETPROFILES_TIMER_INTERVAL_MINUTES) * 60 * 1000),
  getProfilesTimerDelayMs: Math.round(parseFloat(process.env.GETPROFILES_TIMER_DELAY_MINUTES) * 60 * 1000),
  puppeteerConfig,
  phoneConfig,
  tgBotToken: process.env.TELEGRAM_BOT_TOKEN,
  tgAdminChatId: parseInt(process.env.TELEGRAM_ADMIN_CHAT_ID, 10),
  bucketName: process.env.SCRAPER_BUCKET_NAME,
  neo4jUri: process.env.NEO4J_URI,
  neo4jUser: process.env.NEO4J_USERNAME,
  neo4jPass: process.env.NEO4J_PASSWORD,
  waAccountDescription: `${phoneConfig.device}, ${phoneConfig.account} (${phoneConfig.name}) (${phoneConfig.sim}) (${phoneConfig.simId})`,
  recycleTime: { hr, mn },
};
