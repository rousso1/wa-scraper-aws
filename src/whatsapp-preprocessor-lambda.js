const s3Helper = require('./s3-helper');
const cypher = require('./eventHandlers');

const handleWhatsapp = async (eventData) => {
  switch (eventData.eventName) {
    case 'get_chats':
      return cypher.getChatsHandler(eventData);

    case 'get_profiles':
      return cypher.getProfilesHandler(eventData);

    case 'contact_changed':
      return cypher.contactChangedHandler(eventData);

    case 'group_leave':
      return cypher.groupLeaveHandler(eventData);

    case 'group_join':
      return cypher.groupJoinHandler(eventData);

    case 'group_membership_request':
      break;

    case 'group_update':
      break;

    case 'group_admin_changed':
      break;

    case 'message':
      return cypher.messageHandler(eventData);

    case 'message_reaction':
      break;

    case 'message_edit':
      break;
  }
};

const handler = async (event) => {
  console.log(`Received event ${JSON.stringify(event)}`);
  for (let record of event.Records) {
    const sqsMessage = JSON.parse(record.body);

    for (let s3Record of sqsMessage.Records) {
      const key = decodeURIComponent(s3Record.s3.object.key);
      const bucketName = s3Record.s3.bucket.name;

      let contentForIndexing = await s3Helper.getFromS3(bucketName, key);
      await handleWhatsapp(contentForIndexing);
    }
  }
};

module.exports = { handler };
