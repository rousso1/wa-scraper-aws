const preprocessor = require('../../src/whatsapp-preprocessor-lambda');

const test_handler = async () => {
  const testEvent = {
    Records: [
      {
        messageId: '324210e3-74e9-449c-96db-be37eca0a743',
        receiptHandle:
          'AQEBeLguQw3l1BmgGfHc8Yjy1fSgiKVLBhaawlQBn8ngof7h12qWhBhnylXlqUKhqYWxuJV2osTRQaUg+2Z+9PQfOzdthPpbg3k7U3DQaxcSTCq3od4/KsDuDft1vENMFdkcqi69D6zTNUNRXfDMWOnS88fnh5XaFc3x4K1IkpZ6vmFqDASFNC5ihwrIWNqpsL7EhRd7bERvys++zRtXsikiUOUF93gQIi24V27+X/x5sVx+y1Q3EaFUdzBV21ujJwVG8U2dNNK74IwSOZeh7KTZKmewdExexpJrWjoNvX2AFgXuGhFPtTIPBRPwvnY800ncves1rNka9kUeWyEIrZeCsfZbsxIoeVGptEkwHLnEEC0lubgHeGXdLhzJihDrWpqXsYhRaQQPUN3H8XWYKdkgMEhSKAbZ/IFdpoz7TCyMwwE=',
        body: '{"Records":[{"eventVersion":"2.1","eventSource":"aws:s3","awsRegion":"eu-central-1","eventTime":"2024-01-29T21:52:26.531Z","eventName":"ObjectCreated:Put","userIdentity":{"principalId":"AWS:AIDA24IK3XCXBJSURYLPD"},"requestParameters":{"sourceIPAddress":"31.187.78.250"},"responseElements":{"x-amz-request-id":"YVJJH871MASCWC16","x-amz-id-2":"vDMRgpljGRCMgAQVxxn51iUztIDKWXr1uHoSEa+Sz2joiUxaEU6mDvhhw5gfFhhsNw1TrIiPfvXAALF5811dg2FJ1mlWbZVO"},"s3":{"s3SchemaVersion":"1.0","configurationId":"whatsapp s3 creation to whatsapp-preprocessing-queue","bucket":{"name":"whatsapp-raw-entry-bucket","ownerIdentity":{"principalId":"A1XPG7J69J9LIJ"},"arn":"arn:aws:s3:::whatsapp-raw-entry-bucket"},"object":{"key":"group/972505518900-1627908416%40g.us/messages/author/972504729336%40c.us/msgId/3EB0A6F17E29B9FD3BD720/false_972505518900-1627908416%40g.us_3EB0A6F17E29B9FD3BD720_972504729336%40c.us.json","size":2581,"eTag":"6d8f07a36db0f36b9a536b4be10afbc6","sequencer":"0065B81E1A7A9F9B1D"}}}]}',
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: '1706565147051',
          SenderId: 'AROAXYCRW4AK7Q4NSCWWZ:S3-PROD-END',
          ApproximateFirstReceiveTimestamp: '1706565147057',
        },
        messageAttributes: {},
        md5OfBody: '4c316bb9392275ced7f0cb514a007246',
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:eu-central-1:747883968686:whatsapp-preprocessing-queue',
        awsRegion: 'eu-central-1',
      },
    ],
  };
  preprocessor.handler(testEvent);
};

// test_handler();
