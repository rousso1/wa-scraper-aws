const path = require('path');

const getMessageKey = (msg, fileName) => {
  const msgId = msg.id;
  return path.join('group', msgId.remote, 'messages', 'author', msgId.participant, 'msgId', msgId.id, fileName);
};

const getMessageReactionKey = (msgReaction) => {
  const msgId = msgReaction.msgId;
  return path.join(
    'group',
    msgId.remote,
    'messages',
    'author',
    msgId.participant,
    'msgId',
    msgId.id,
    'reactions',
    `${msgReaction.id._serialized}.json`
  );
};

const getGroupJoinKey = (groupJoin) => {
  return path.join('group', groupJoin.chatId, 'members', 'joins', `${groupJoin.id._serialized}.json`);
};

const getGroupLeaveKey = (groupLeave) => {
  return path.join('group', groupLeave.chatId, 'members', 'leaves', `${groupLeave.id._serialized}.json`);
};

const getGroupMembershipRequestKey = (membershipRequest) => {
  return path.join(
    'group',
    membershipRequest.chatId,
    'members',
    'requests',
    `${membershipRequest.id._serialized}.json`
  );
};

const getGroupUpdateKey = (groupUpdate) => {
  return path.join('group', groupUpdate.chatId, 'updates', `${groupUpdate.id._serialized}.json`);
};

const getContactChangedKey = (oldId, newId) => {
  return path.join('contactChange', 'oldId', oldId, 'newId', newId, `${oldId}-${newId}.json`);
};

const getGroupAdminChangeKey = (groupAdminChange) => {
  return path.join('group', groupAdminChange.chatId, 'adminsChange', `${groupAdminChange.id._serialized}.json`);
};

module.exports = {
  getMessageKey,
  getMessageReactionKey,
  getGroupJoinKey,
  getGroupLeaveKey,
  getGroupMembershipRequestKey,
  getGroupUpdateKey,
  getContactChangedKey,
  getGroupAdminChangeKey,
};
