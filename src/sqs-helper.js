const AWS = require('./aws');
const newSqs = new AWS.SQS();
// const newSqs = require('../test/AWS/sqs/mock-sqs');

class SQSHelper {
  constructor() {
    this.sqs = newSqs;
  }

  async sendToQueue(queueName, messageBody) {
    const params = {
      QueueUrl: await this.getQueueUrl(queueName),
      MessageBody: messageBody,
    };

    return this.sqs.sendMessage(params).promise();
  }

  async getQueueUrl(QueueName) {
    const { QueueUrl } = await this.sqs
      .getQueueUrl({
        QueueName,
      })
      .promise();

    return QueueUrl;
  }
}

module.exports = new SQSHelper();
