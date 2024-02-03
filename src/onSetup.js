const config = require('./config');
const tgBot = require('./tgBot');
const qrcode = require('qrcode');
const qrTerm = require('qrcode-terminal');
const stats = require('./stats');

const log = (message) => {
  tgBot.sendMessage(message);
  console.log(message);
};

const onQR = async (qr) => {
  stats.report('qr');
  const qrCodeDataUrl = await qrcode.toDataURL(qr);
  const imageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
  const caption = `Scan with ${config.waAccountDescription}`;

  await tgBot.sendPhoto(imageBuffer, caption);

  qrTerm.generate(qr, { small: true });
  console.log(caption);
};

const onRemoteSessionSaved = async () => {
  stats.report('remote_session_saved');
  log(`onRemoteSessionSaved: ${config.waAccountDescription}`);
};

const onReady = async () => {
  stats.report('ready');
  log(`onReady: (${config.waAccountDescription})`);
};

const onDisconnected = async (reason) => {
  stats.report('disconnected');
  log(`onDisconnected: ${reason} (${config.waAccountDescription})`);
};

const onAuthFailure = (message) => {
  stats.report('auth_failure');
  log(`onAuthFailure: ${message} (${config.waAccountDescription})`);
};

const onAuthenticated = () => {
  stats.report('authenticated');
  log(`onAuthenticated: (${config.waAccountDescription})`);
};

const onLoadingScreen = (percent, message) => {
  stats.report('loading_screen');
  log(`onLoadingScreen: ${percent} ${message} (${config.waAccountDescription})`);
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
