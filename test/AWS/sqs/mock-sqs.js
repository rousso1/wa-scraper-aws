class SQSMock {
  constructor() {
    this.messageStore = {};
    this.messageHandlers = {};
  }

  sendMessage(params) {
    const { QueueUrl, MessageBody } = params;

    if (!this.messageStore[QueueUrl]) {
      this.messageStore[QueueUrl] = [];
    }

    const messageId = this.messageStore[QueueUrl].length + 1;
    this.messageStore[QueueUrl].push({
      MessageId: messageId.toString(),
      MessageBody,
    });

    // Trigger registered handlers for the queue
    if (this.messageHandlers[QueueUrl]) {
      this.messageHandlers[QueueUrl].forEach((handler) => {
        handler({ Records: [{ body: MessageBody }] });
      });
    }

    return {
      promise: async () => ({
        MessageId: messageId.toString(),
        MD5OfMessageBody: 'mock-md5',
      }),
    };
  }

  getQueueUrl({ QueueName }) {
    return {
      promise: async () => ({ QueueUrl: `mock-queue-url-for-${QueueName}` }),
    };
  }

  // Register a function to handle messages from a specific queue
  registerMessageHandler(QueueUrl, handler) {
    if (!this.messageHandlers[QueueUrl]) {
      this.messageHandlers[QueueUrl] = [];
    }

    this.messageHandlers[QueueUrl].push(handler);
  }
}

module.exports = new SQSMock();

// // Example usage:
// const sqs = new SQSMock();

// // Mock sendMessage
// const sendMessageParams = { QueueUrl: 'mock-queue', MessageBody: '{"key": "value"}' };
// sqs
//   .sendMessage(sendMessageParams)
//   .promise()
//   .then((result) => console.log('sendMessage result:', result))
//   .catch((error) => console.error('sendMessage error:', error));

// // Register a handler for the mock queue
// sqs.registerMessageHandler('mock-queue', (message) => {
//   console.log('Handler received message:', message);
// });
