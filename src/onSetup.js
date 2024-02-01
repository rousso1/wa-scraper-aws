const config = require('./config');
const tgBot = require('./tgBot');
const qrcode = require('qrcode');
const qrTerm = require('qrcode-terminal');
const stats = require('./stats');

const log = (message) => {
  tgBot.sendMessage(message);
  console.log(message);
};

const waAccountDescription = `${config.phoneConfig.device}, ${config.phoneConfig.account} (${config.phoneConfig.name}) (${config.phoneConfig.sim}) (${config.phoneConfig.simId})`;

const onQR = async (qr) => {
  stats.report('qr');
  const qrCodeDataUrl = await qrcode.toDataURL(qr);
  const imageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
  const caption = `Scan with ${waAccountDescription}`;

  await tgBot.sendPhoto(imageBuffer, caption);

  qrTerm.generate(qr, { small: true });
  console.log(caption);
};

const onRemoteSessionSaved = async () => {
  stats.report('remote_session_saved');
  log(`onRemoteSessionSaved: ${waAccountDescription}`);
};

const onReady = async () => {
  stats.report('ready');
  log(`onReady: (${waAccountDescription})`);
};

const onDisconnected = async (reason) => {
  stats.report('disconnected');
  log(`onDisconnected: ${reason} (${waAccountDescription})`);
};

const onAuthFailure = (message) => {
  stats.report('auth_failure');
  log(`onAuthFailure: ${message} (${waAccountDescription})`);
};

const onAuthenticated = () => {
  stats.report('authenticated');
  log(`onAuthenticated: (${waAccountDescription})`);
};

const onLoadingScreen = (percent, message) => {
  stats.report('loading_screen');
  log(`onLoadingScreen: ${percent} ${message} (${waAccountDescription})`);
};

module.exports = {
  onQR,
  onRemoteSessionSaved,
  onReady,
  onDisconnected,
  onAuthFailure,
  onAuthenticated,
  onLoadingScreen,
};
