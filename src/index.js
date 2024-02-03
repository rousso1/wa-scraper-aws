const s3Helper = require('./s3-helper');
const handlers = require('./eventHandlers');
const path = require('path');

/* whatsapp-preprocessor lambda */

const handleWhatsapp = async (eventData) => {
  console.log(`Received eventName: ${eventData.eventName}`);
  switch (eventData.eventName) {
    case 'get_chats':
      return handlers.getChatsHandler(eventData);

    case 'get_profiles':
      return handlers.getProfilesHandler(eventData);

    case 'contact_changed':
      return handlers.contactChangedHandler(eventData);

    case 'group_leave':
      return handlers.groupLeaveHandler(eventData);

    case 'group_join':
      return handlers.groupJoinHandler(eventData);

    case 'group_membership_request':
      break;

    case 'group_update':
      break;

    case 'group_admin_changed':
      break;

    case 'message':
      return handlers.messageHandler(eventData);

    case 'message_reaction':
      return handlers.messageReactionHandler(eventData);

    case 'message_edit':
      break;

    default:
      break;
  }
};

const handler = async (event) => {
  for (let record of event.Records) {
    const sqsMessage = JSON.parse(record.body);

    for (let s3Record of sqsMessage.Records) {
      const key = decodeURIComponent(s3Record.s3.object.key);
      const bucketName = s3Record.s3.bucket.name;

      if (path.extname(key) === '.json') {
        console.log(`handleWhatsapp with ${key}`);
        let contentForIndexing = await s3Helper.getFromS3(bucketName, key);
        await handleWhatsapp(contentForIndexing);
      }
    }
  }
};

module.exports = { handler };
