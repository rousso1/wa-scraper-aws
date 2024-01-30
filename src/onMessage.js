const s3Helper = require('./s3-helper');
const sqsHelper = require('./sqs-helper');
const config = require('./config');
const mime = require('mime-types');
const keys = require('./s3Keys');
const crypto = require('crypto');

const getKey = keys.getMessageKey;

const getHash = (str, len = 12) => {
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  return hash.substring(0, len);
};

const handleMedia = async (msg) => {
  if (!msg.hasMedia) {
    return { msgMediaPromises: [], mediaKey: null };
  }
  const media = (await msg.downloadMedia()) || (await msg.downloadMedia()); //2 attempts

  if (!media) {
    const mediaErrorKey = getKey(msg, `${msg.id._serialized}.media-error.txt`);

    return {
      msgMediaPromises: [s3Helper.saveToS3(mediaErrorKey, config.bucketName, 'Attached media failed to download.')],
      mediaKey: null,
    };
  }

  const extension = mime.extension(media.mimetype) || 'file';
  const mediaMetadata = {
    filesize: media.filesize,
    filename: media.filename,
    mimetype: media.mimetype,
  };

  const mediaKey = getKey(msg, `${msg.id._serialized}.${extension}`);
  const mediaMetaKey = getKey(msg, `${msg.id._serialized}.media-metadata.json`);

  const mediaPromises = [
    s3Helper.saveToS3(mediaMetaKey, config.bucketName, JSON.stringify(mediaMetadata)),
    s3Helper.saveToS3(mediaKey, config.bucketName, Buffer.from(media.data, 'base64'), media.mimetype),
  ];

  return { mediaPromises, mediaKey };
};

const onMessage = async (msg) => {
  const keyName = getKey(msg, `${msg.id._serialized}.json`);
  const msgPromise = s3Helper.saveToS3(keyName, config.bucketName, JSON.stringify(msg));
  const { msgMediaPromises, mediaKey } = await handleMedia(msg);

  await Promise.all([msgPromise].concat(msgMediaPromises));
  if (mediaKey) {
    await sqsHelper.sendToQueue(config.preprocessingQueue, JSON.stringify({ base64FileKey: mediaKey }));
  }
};

const onMessageReaction = async (reaction) => {
  const key = keys.getMessageReactionKey(reaction);

  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify(reaction));
};

const onMessageEdit = async (msg, newBody, prevBody) => {
  const key = getKey(msg, `${msg.id._serialized}-edit-${getHash(newBody, 10)}.json`);
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify({ msg, newBody, prevBody }));
};

module.exports = { onMessage, onMessageReaction, onMessageEdit };