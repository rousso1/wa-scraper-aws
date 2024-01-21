const mime = require('mime-types');
const AWS = require('./aws');
const path = require('path');

const s3 = new AWS.S3();
// const S3Mock = require('../test/AWS/s3/mock-s3');
// const s3 = new S3Mock();

const splitKey = (key) => {
  return key.split('/');
};

const getSource = (key) => {
  const keyParts = splitKey(key);
  return keyParts.shift();
};

const getFileName = (key) => {
  const keyParts = splitKey(key);
  return keyParts.pop();
};

const getExtension = (key) => {
  const fileName = getFileName(key);
  const fileNameArr = fileName.split('.');
  return fileNameArr.pop();
};

const getEncoding = (key) => {
  const extension = getExtension(key);
  const utf8 = ['json', 'html', 'htm', 'txt', 'base64'];

  return utf8.includes(extension) ? 'utf-8' : 'binary';
};

const getFromS3 = async (bucketName, key) => {
  console.log(`Getting ${key} from ${bucketName}`);

  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const s3Object = await s3.getObject(params).promise();
  const encoding = getEncoding(key);
  const response = s3Object.Body.toString(encoding);
  return getExtension(key) === 'json' ? JSON.parse(response) : response;
};

async function saveToS3(key, bucketName, body, contentType = null) {
  const uploadParams = {
    Bucket: bucketName,
    Key: key,
    Body: body,
  };

  contentType = contentType || mime.contentType(path.extname(key));
  if (contentType) {
    uploadParams.ContentType = contentType;
  }

  console.log(`uploading ${uploadParams.ContentType}: ${path.join(bucketName, key)}`);
  return s3.upload(uploadParams).promise();
}

async function deleteFromS3(key, bucketName) {
  const deleteParams = {
    Bucket: bucketName,
    Key: key,
  };

  return s3.deleteObject(deleteParams).promise();
}

module.exports = { getFromS3, saveToS3, deleteFromS3, getSource, getExtension };
