const mime = require('mime-types');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client();
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

const streamToPromise = async (stream, encoding) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString(encoding)));
    stream.on('error', reject);
  });
};

const getFromS3 = async (bucketName, key) => {
  console.log(`Getting ${key} from ${bucketName}`);

  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const s3Object = await s3Client.send(new GetObjectCommand(params));
  const encoding = getEncoding(key);
  const response = await streamToPromise(s3Object.Body, encoding);
  return getExtension(key) === 'json' && typeof response !== 'object' ? JSON.parse(response) : response;
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
  const command = new PutObjectCommand(uploadParams);
  return await s3Client.send(command);
}

async function deleteFromS3(key, bucketName) {
  const deleteParams = {
    Bucket: bucketName,
    Key: key,
  };

  return await s3Client.send(new DeleteObjectCommand(deleteParams));
}

module.exports = { getFromS3, saveToS3, deleteFromS3, getSource, getExtension };
