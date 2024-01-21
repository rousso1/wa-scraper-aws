const fs = require('fs').promises;
const path = require('path');
// const createPathRecursive = async (path) => {
//   return await fs.promises.mkdir(path, { recursive: true });
// };

const saveFile = async (filePath, contents, encoding) => {
  const dirname = path.dirname(filePath);

  try {
    await fs.mkdir(dirname, { recursive: true });
    await fs.writeFile(filePath, contents, encoding);
    if (filePath.indexOf('members') !== -1) {
      console.log(`mock s3 saving file ${filePath}`);
    }
  } catch (error) {
    console.error(`Error creating file ${filePath}: ${error.message}`);
  }
};

class S3Mock {
  constructor() {
    this.mockBucket = {};
  }

  getObject(params) {
    const { Bucket, Key } = params;
    const data = this.mockBucket[Bucket] && this.mockBucket[Bucket][Key];

    if (!data) {
      const error = new Error('Object not found');
      error.code = 'NoSuchKey';
      return { promise: async () => Promise.reject(error) };
    }

    return {
      promise: async () => ({
        Body: Buffer.from(data),
        ContentLength: Buffer.byteLength(data),
      }),
    };
  }

  upload(params) {
    const { Bucket, Key, Body, ContentType } = params;
    this.mockBucket[Bucket] = this.mockBucket[Bucket] || {};
    this.mockBucket[Bucket][Key] = Body.toString();
    const encoding =
      !ContentType || ContentType.startsWith('text') || ContentType === 'application/json' ? 'utf8' : 'binary';

    const location = path.join('./', Bucket, Key);
    saveFile(location, Body, encoding);

    return {
      promise: async () => ({
        Bucket,
        Key,
        Location: location,
        ETag: 'mock-etag',
      }),
    };
  }

  deleteObject(params) {
    const { Bucket, Key } = params;
    if (this.mockBucket[Bucket][Key]) {
      delete this.mockBucket[Bucket][Key];
    } else {
      console.log(
        `should delete this.mockBucket[Bucket][Key] but was null/undefined  this.mockBucket['${Bucket}']['${Key}']`
      );
    }
    console.log(`should delete from disk: ${path.join('./', Bucket, Key)}`);

    return {
      promise: async () => ({
        Bucket,
        Key,
      }),
    };
  }
}

module.exports = S3Mock;

// // Example usage:
// const s3 = new S3Mock();

// // Mock getObject
// const getObjectParams = { Bucket: 'mock-bucket', Key: 'mock-key' };
// s3.getObject(getObjectParams)
//   .promise()
//   .then((result) => console.log('getObject result:', result))
//   .catch((error) => console.error('getObject error:', error));

// // Mock upload
// const uploadParams = { Bucket: 'mock-bucket', Key: 'mock-key', Body: 'mock-data' };
// s3.upload(uploadParams)
//   .promise()
//   .then((result) => console.log('upload result:', result))
//   .catch((error) => console.error('upload error:', error));

// // Mock deleteObject
// const deleteParams = { Bucket: 'mock-bucket', Key: 'mock-key' };
// s3.deleteObject(deleteParams)
//   .promise()
//   .then((result) => console.log('deleteObject result:', result))
//   .catch((error) => console.error('deleteObject error:', error));
