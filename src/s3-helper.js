const mime = require('mime-types');
// const AWS = require('./aws');
const path = require('path');
const config = require('./config');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: config.awsRegion });
// const s3 = new AWS.S3(); //old V2
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

  const s3Object = await s3Client.send(new GetObjectCommand(params));
  // const s3Object = await s3.getObject(params).promise(); //old V2
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
  const command = new PutObjectCommand(uploadParams);
  return await s3Client.send(command);
  // return s3.upload(uploadParams).promise(); //old V2

  // return s3
  //   .upload(uploadParams)
  //   .promise()
  //   .then((retVal) => {
  //     //TODO: Remove this then() section as it is configured in AWS in the s3 bucket config
  //     sqsHelper.sendToQueue(
  //       config.preprocessingQueue,
  //       `{
  //         "Records": [
  //           {
  //             "eventVersion": "2.1",
  //             "eventSource": "aws:s3",
  //             "awsRegion": "eu-central-1",
  //             "eventTime": "2024-01-29T21:52:26.531Z",
  //             "eventName": "ObjectCreated:Put",
  //             "userIdentity": { "principalId": "AWS:AIDA24IK3XCXBJSURYLPD" },
  //             "requestParameters": { "sourceIPAddress": "31.187.78.250" },
  //             "responseElements": {
  //               "x-amz-request-id": "YVJJH871MASCWC16",
  //               "x-amz-id-2": "vDMRgpljGRCMgAQVxxn51iUztIDKWXr1uHoSEa+Sz2joiUxaEU6mDvhhw5gfFhhsNw1TrIiPfvXAALF5811dg2FJ1mlWbZVO"
  //             },
  //             "s3": {
  //               "s3SchemaVersion": "1.0",
  //               "configurationId": "whatsapp s3 creation to whatsapp-preprocessing-queue",
  //               "bucket": {
  //                 "name": "${bucketName}",
  //                 "ownerIdentity": { "principalId": "A1XPG7J69J9LIJ" },
  //                 "arn": "arn:aws:s3:::${bucketName}t"
  //               },
  //               "object": {
  //                 "key": "${key}",
  //                 "size": 2581,
  //                 "eTag": "6d8f07a36db0f36b9a536b4be10afbc6",
  //                 "sequencer": "0065B81E1A7A9F9B1D"
  //               }
  //             }
  //           }
  //         ]
  //       }`
  //     );
  //     return retVal;
  //   });
}

async function deleteFromS3(key, bucketName) {
  const deleteParams = {
    Bucket: bucketName,
    Key: key,
  };

  return await s3Client.send(new DeleteObjectCommand(deleteParams));
  // return s3.deleteObject(deleteParams).promise(); //old v2
}

module.exports = { getFromS3, saveToS3, deleteFromS3, getSource, getExtension };
