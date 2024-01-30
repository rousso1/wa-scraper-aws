const fs = require('fs');
const chatsHelper = require('../../src/eventHandlers');

const test_getChatsHandler = () => {
  const eventData = JSON.parse(
    fs.readFileSync('./whatsapp-raw-entry-bucket/group/972503322843-1562593014@g.us/metadata/chat-1705659294274.json', {
      encoding: 'utf-8',
    })
  );
  const res = chatsHelper.getChatsHandler(eventData);
  console.log(res);
};

const test_getProfilesHandler = () => {
  const eventData = JSON.parse(
    fs.readFileSync('./whatsapp-raw-entry-bucket/profiles/profiles-1706601985513.json', {
      encoding: 'utf-8',
    })
  );
  const res = chatsHelper.getProfilesHandler(eventData);
  console.log(res);
};

// test_getProfilesHandler();

const test_contactChangedHandler = () => {
  const eventData = JSON.parse(
    fs.readFileSync(
      './whatsapp-raw-entry-bucket/contactChange/oldId/972539354208@c.us/newId/972534155270@c.us/972539354208@c.us-972534155270@c.us.json',
      {
        encoding: 'utf-8',
      }
    )
  );

  const res = chatsHelper.contactChangedHandler(eventData);
  console.log(res);
};
// test_contactChangedHandler();

const test_groupJoinHandler = () => {
  const eventData = JSON.parse(
    fs.readFileSync(
      './whatsapp-raw-entry-bucket/group/120363022328554201@g.us/members/joins/false_120363022328554201@g.us_42782165291705872933_972534233600@c.us.json',
      {
        encoding: 'utf-8',
      }
    )
  );

  const res = chatsHelper.groupJoinHandler(eventData);
  console.log(res);
};
// test_groupJoinHandler();

const test_messageHandler = () => {
  const eventData = JSON.parse(
    fs.readFileSync(
      './whatsapp-raw-entry-bucket/group/120363028573727195@g.us/messages/author/972539313151@c.us/msgId/D981C1F26782C480C7C2D22565E8B1BD/false_120363028573727195@g.us_D981C1F26782C480C7C2D22565E8B1BD_972539313151@c.us.json',
      {
        encoding: 'utf-8',
      }
    )
  );

  const res = chatsHelper.groupJoinHandler(eventData);
  console.log(res);
};

//test_messageHandler()
