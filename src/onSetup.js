const fs = require('fs');
const config = require('./config');
const tgBot = require('./tgBot');
const qrcode = require('qrcode');
const qrTerm = require('qrcode-terminal');

const log = (message) => {
  tgBot.sendMessage(message);
  console.log(message);
};

const waAccountDescription = `${config.phoneConfig.device}, ${config.phoneConfig.account} (${config.phoneConfig.name}) (${config.phoneConfig.sim}) (${config.phoneConfig.simId})`;

const onQR = async (qr) => {
  const qrCodeDataUrl = await qrcode.toDataURL(qr);
  const imageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
  const caption = `Scan with ${waAccountDescription}`;

  await tgBot.sendPhoto(imageBuffer, caption);

  qrTerm.generate(qr, { small: true });
  console.log(caption);
};

const onRemoteSessionSaved = async () => {
  log(`onRemoteSessionSaved: ${waAccountDescription}`);
};

const onReady = async () => {
  log(`onReady: (${waAccountDescription})`);
};

const onDisconnected = async (reason) => {
  log(`onDisconnected: ${reason} (${waAccountDescription})`);
};

const onAuthFailure = (message) => {
  log(`onAuthFailure: ${message} (${waAccountDescription})`);
};

const onAuthenticated = () => {
  log(`onAuthenticated: (${waAccountDescription})`);
};

const onLoadingScreen = (percent, message) => {
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
