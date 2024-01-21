const keys = require('./s3Keys');
const s3Helper = require('./s3-helper');
const config = require('./config');

const onContactChanged = (message, oldId, newId, isContact) => {
  const key = keys.getContactChangedKey(oldId, newId);
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify({ message, oldId, newId, isContact }));
};

module.exports = { onContactChanged };
