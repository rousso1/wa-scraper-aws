const config = require('./config');
const { Client, LocalAuth } = require('whatsapp-web.js');
const onMessage = require('./onMessage');
const onGroup = require('./onGroup');
const onContact = require('./onContact');
const onSetup = require('./onSetup');
const onTimer = require('./onTimer');

const createPassiveClient = async () => {
  const clientId = `${config.phoneConfig.sim.substring(1)}_${config.phoneConfig.simId}`;

  const client = new Client({
    authStrategy: new LocalAuth({ clientId }),
    puppeteer: config.puppeteerConfig,
  });

  client.on('ready', onSetup.onReady);
  client.on('qr', onSetup.onQR);
  client.on('remote_session_saved', onSetup.onRemoteSessionSaved);
  client.on('loading_screen', onSetup.onLoadingScreen);
  client.on('authenticated', onSetup.onAuthenticated);
  client.on('auth_failure', onSetup.onAuthFailure);
  client.on('disconnected', onSetup.onDisconnected);

  client.on('group_join', onGroup.onGroupJoin);
  client.on('group_leave', onGroup.onGroupLeave);
  client.on('group_membership_request', onGroup.onGroupMembershipRequest);
  client.on('group_update', onGroup.onGroupUpdate);
  client.on('group_admin_changed', onGroup.onGroupAdminChange);

  client.on('contact_changed', onContact.onContactChanged);

  client.on('message', onMessage.onMessage);
  client.on('message_reaction', onMessage.onMessageReaction);
  client.on('message_edit', onMessage.onMessageEdit);

  await client.initialize();

  onTimer.setup(client);
  console.log(`${config.phoneConfig.sim} init complete ${new Date().toString()}`);
};

createPassiveClient();

// const setupMockLambdaQueue = async () => {
//   const preprocessor = require('./whatsapp-preprocessor-lambda');
//   const mockSqs = require('../test/AWS/sqs/mock-sqs');
//   const QueueUrl = (await mockSqs.getQueueUrl({ QueueName: config.preprocessingQueue }).promise()).QueueUrl;
//   mockSqs.registerMessageHandler(QueueUrl, preprocessor.handler);
// };
// setupMockLambdaQueue();
