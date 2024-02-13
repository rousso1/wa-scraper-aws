const s3Helper = require('./s3-helper');
const handlers = require('./eventHandlers');
const path = require('path');
const driver = require('./cypherQueries.js').driver;

/* whatsapp-preprocessor lambda */

const handleWhatsapp = async (eventData, session) => {
  console.log(`Received eventName: ${eventData.eventName}`);
  switch (eventData.eventName) {
    case 'get_chats':
      return handlers.getChatsHandler(eventData, session);

    case 'got_profile':
      return handlers.gotProfileHandler(eventData, session);

    case 'contact_changed':
      return handlers.contactChangedHandler(eventData, session);

    case 'group_leave':
      return handlers.groupLeaveHandler(eventData, session);

    case 'group_join':
      return handlers.groupJoinHandler(eventData, session);

    case 'group_membership_request':
      break;

    case 'group_update':
      break;

    case 'group_admin_changed':
      break;

    case 'message':
      return handlers.messageHandler(eventData, session);

    case 'message_reaction':
      return handlers.messageReactionHandler(eventData, session);

    case 'message_edit':
      break;

    default:
      break;
  }
};

const handler = async (event) => {
  for (let record of event.Records) {
    const sqsMessage = JSON.parse(record.body);
    const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    try {
      for (let s3Record of sqsMessage.Records) {
        const key = decodeURIComponent(s3Record.s3.object.key);
        const bucketName = s3Record.s3.bucket.name;

        if (path.extname(key) === '.json') {
          console.log(`handleWhatsapp with ${key}`);
          let contentForIndexing = await s3Helper.getFromS3(bucketName, key);
          await handleWhatsapp(contentForIndexing, session);
        }
      }
    } catch (ex) {
      console.log(`sqsMessage.Records: ${JSON.stringify(sqsMessage.Records)}`);
    } finally {
      await session.close();
    }
  }
};

module.exports = { handler };
