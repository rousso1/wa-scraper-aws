const cypher = require('./cypherQueries');

const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  return formattedDate;
};

const idToPhone = (id) => {
  return `+${id.split('@')[0]}`;
};

const getParticipants = (chat) => {
  const participants = chat.groupMetadata?.participants || [];

  participants.sort((a, b) => {
    return a.isAdmin === b.isAdmin ? 0 : a.isAdmin ? -1 : 1;
  });

  return participants;
};

const identifiedOnly = (item) => {
  return item.id.server === 'c.us';
};

const getParticipantsNumbers = (chat, isAdmin = null) => {
  const participants = getParticipants(chat)
    .filter(identifiedOnly)
    .filter((item) => {
      if (isAdmin === true) {
        //admins only
        return item.isAdmin || item.isSuperAdmin;
      }
      if (isAdmin === false) {
        //non admins only
        return !item.isAdmin && !item.isSuperAdmin;
      }
      //everyone
      return true;
    });
  return participants.map((p) => idToPhone(p.id._serialized));
};

const getChatsHandler = async (eventData) => {
  const newMembers = getParticipantsNumbers(eventData, false);
  const newAdmins = getParticipantsNumbers(eventData, true);
  const groupId = eventData.id._serialized;
  const timestamp = formatDateTime(new Date(eventData.timestamp * 1000));
  //TODO: assert these are received as arrays
  const currentMembers = await cypher.getContactsWithGroupRelationships(groupId, 'GROUP_MEMBER');
  const currentAdmins = await cypher.getContactsWithGroupRelationships(groupId, 'GROUP_ADMIN');

  await cypher.upsertGroup(eventData);

  for (const currentMember of currentMembers) {
    if (!newMembers.includes(currentMember)) {
      //those numbers left the group
      await cypher.deleteContactToGroupRelationship(currentMember, groupId, 'GROUP_MEMBER', timestamp);
      await cypher.upsertContactToGroupRelationship(currentMember, groupId, 'WAS_GROUP_MEMBER', timestamp);
    }
  }

  for (const currentAdmin of currentAdmins) {
    if (!newAdmins.includes(currentAdmin)) {
      //those numbers are no longer admins
      await cypher.deleteContactToGroupRelationship(currentAdmin, groupId, 'GROUP_ADMIN', timestamp);
      await cypher.upsertContactToGroupRelationship(currentAdmin, groupId, 'WAS_GROUP_ADMIN', timestamp);
    }
  }

  for (const newMember of newMembers) {
    if (!currentMembers.includes(newMember)) {
      await cypher.upsertContact(newMember);
    }

    //run even if exists so timestamp will be updated
    await cypher.upsertContactToGroupRelationship(newMember, groupId, 'GROUP_MEMBER', timestamp);
  }

  for (const newAdmin of newAdmins) {
    if (!currentAdmins.includes(newAdmin)) {
      await cypher.upsertContact(newAdmin);
    }

    //run even if exists so timestamp will be updated
    await cypher.upsertContactToGroupRelationship(newAdmin, groupId, 'GROUP_MEMBER', timestamp);
  }
};

const getProfilesHandler = async (eventData) => {
  const identifiedItems = eventData.filter(identifiedOnly);

  for (const item of identifiedItems) {
    await cypher.upsertContact(idToPhone(item.id._serialized), item.pushname);
  }
};

const contactChangedHandler = async (eventData) => {
  const oldNumber = idToPhone(eventData.oldId);
  const newNumber = idToPhone(eventData.newId);
  const timestamp = formatDateTime(new Date(eventData.message.timestamp * 1000));

  await cypher.upsertContact(newNumber);
  await cypher.upsertContactToContactRelationship(oldNumber, newNumber, 'CHANGED_TO', timestamp);
};

const groupLeaveHandler = async (eventData) => {
  const leavingNumbers = eventData.recipientIds.map(idToPhone);
  const groupId = eventData.chatId;
  const timestamp = formatDateTime(new Date(eventData.timestamp * 1000));

  for (const leavingNumber of leavingNumbers) {
    await cypher.deleteContactToGroupRelationship(leavingNumber, groupId, 'GROUP_MEMBER', timestamp);
    await cypher.upsertContactToGroupRelationship(leavingNumber, groupId, 'WAS_GROUP_MEMBER', timestamp);
  }
};

const groupJoinHandler = async (eventData) => {
  const newNumbers = eventData.recipientIds.map(idToPhone);
  const groupId = eventData.chatId;
  const timestamp = formatDateTime(new Date(eventData.timestamp * 1000));

  for (const newNumber of newNumbers) {
    await cypher.upsertContact(newNumber);
    await cypher.upsertContactToGroupRelationship(newNumber, groupId, 'GROUP_MEMBER', timestamp);
  }
};

const messageHandler = async (eventData) => {
  //TODO
  //upsert group
  //upsert author account
  //upsert message
  //upsert relationship group -> message
  //upsert relationship author --> message
  //relationship memberOf between  wa-account and group (if doesnt exist)
};

const messageReactionHandler = async (eventData) => {};

module.exports = {
  getChatsHandler,
  getProfilesHandler,
  contactChangedHandler,
  groupLeaveHandler,
  groupJoinHandler,
  messageHandler,
  messageReactionHandler,
};
