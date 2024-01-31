const s3Helper = require('./s3-helper');
const config = require('./config');
const mime = require('mime-types');
const keys = require('./s3Keys');
const lib = require('./lib');

const getKey = keys.getMessageKey;

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
    eventName: 'media-metadata',
  };

  const mediaKey = getKey(msg, `${msg.id._serialized}.${extension}`);
  const mediaMetaKey = getKey(msg, `${msg.id._serialized}.media-metadata.json`);

  const mediaPromises = [
    s3Helper.saveToS3(mediaMetaKey, config.bucketName, JSON.stringify(mediaMetadata)),
    s3Helper.saveToS3(mediaKey, config.bucketName, Buffer.from(media.data, 'base64'), media.mimetype),
  ];

  return mediaPromises;
};

const onMessage = async (msg) => {
  const keyName = getKey(msg, `${msg.id._serialized}.json`);
  msg.eventName = 'message';
  const msgPromise = s3Helper.saveToS3(keyName, config.bucketName, JSON.stringify(msg));
  const msgMediaPromises = await handleMedia(msg);

  await Promise.all([msgPromise].concat(msgMediaPromises));
};

const onMessageReaction = async (reaction) => {
  const key = keys.getMessageReactionKey(reaction);
  reaction.eventName = 'message_reaction';

  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify(reaction));
};

const onMessageEdit = async (msg, newBody, prevBody) => {
  const key = getKey(msg, `${msg.id._serialized}-edit-${lib.getHash(newBody, 10)}.json`);
  const jsonToSave = {
    eventName: 'message_edit',
    msg,
    newBody,
    prevBody,
  };
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify(jsonToSave));
};

module.exports = { onMessage, onMessageReaction, onMessageEdit };
