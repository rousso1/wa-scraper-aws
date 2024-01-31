const cypher = require('./cypherQueries');
const lib = require('./lib');
const fs = require('fs');

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

const getGroupFields = (groupId, chat) => {
  const metaData = chat.groupMetadata;
  // Use a regular expression to match invisible characters
  const regex = /[\p{Cf}]/gu;

  const fields = {
    groupId,
    createDate: lib.formatDateTime(new Date(metaData.creation * 1000)),
    subject: metaData.subject?.replace(regex, '') || '',
    subjectTime: lib.formatDateTime(new Date(metaData.subjectTime * 1000)),
    description: metaData.desc?.replace(regex, '') || '',
    descriptionTime: lib.formatDateTime(new Date(metaData.descTime * 1000)),
    descriptionSetBy: metaData.descOwner ? idToPhone(metaData.descOwner._serialized) : '',
    memberAddMode: metaData.memberAddMode || '',
    // groupPicture: chat.groupPicture,
  };
  const hash = lib.getHash(Object.values(fields).join(''));
  fields.hash = hash;
  return fields;
};

const getChatsHandler = async (eventData) => {
  if (!eventData.isGroup) {
    return;
  }
  const newMembers = getParticipantsNumbers(eventData, false);
  const newAdmins = getParticipantsNumbers(eventData, true);
  const groupId = eventData.id._serialized;
  const timestamp = lib.formatDateTime(new Date(eventData.timestamp * 1000));
  //TODO: assert these are received as arrays
  const currentMembers = await cypher.getContactsWithGroupRelationships(groupId, 'GROUP_MEMBER');
  const currentAdmins = await cypher.getContactsWithGroupRelationships(groupId, 'GROUP_ADMIN');

  await cypher.upsertGroup(groupId, getGroupFields(groupId, eventData));

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
      await cypher.upsertContact(newMember, timestamp);
    }

    //run even if exists so timestamp will be updated
    await cypher.upsertContactToGroupRelationship(newMember, groupId, 'GROUP_MEMBER', timestamp);
  }

  for (const newAdmin of newAdmins) {
    if (!currentAdmins.includes(newAdmin)) {
      await cypher.upsertContact(newAdmin, timestamp);
    }

    //run even if exists so timestamp will be updated
    await cypher.upsertContactToGroupRelationship(newAdmin, groupId, 'GROUP_MEMBER', timestamp);
  }
};

const getProfilesHandler = async (eventData) => {
  const identifiedItems = eventData.profiles.filter(identifiedOnly);
  const timestamp = lib.formatDateTime(new Date());

  for (const item of identifiedItems) {
    await cypher.upsertContact(idToPhone(item.id._serialized), timestamp, item.pushname);
  }
};

const contactChangedHandler = async (eventData) => {
  const oldNumber = idToPhone(eventData.oldId);
  const newNumber = idToPhone(eventData.newId);
  const timestamp = lib.formatDateTime(new Date(eventData.message.timestamp * 1000));

  await cypher.upsertContact(oldNumber, timestamp);
  await cypher.upsertContact(newNumber, timestamp);
  await cypher.upsertContactToContactRelationship(oldNumber, newNumber, 'CHANGED_TO', timestamp);
};

const groupLeaveHandler = async (eventData) => {
  const leavingNumbers = eventData.recipientIds.map(idToPhone);
  const groupId = eventData.chatId;
  const timestamp = lib.formatDateTime(new Date(eventData.timestamp * 1000));

  for (const leavingNumber of leavingNumbers) {
    await cypher.deleteContactToGroupRelationship(leavingNumber, groupId, 'GROUP_MEMBER', timestamp);
    await cypher.upsertContactToGroupRelationship(leavingNumber, groupId, 'WAS_GROUP_MEMBER', timestamp);
  }
};

const groupJoinHandler = async (eventData) => {
  const newNumbers = eventData.recipientIds.map(idToPhone);
  const groupId = eventData.chatId;
  const timestamp = lib.formatDateTime(new Date(eventData.timestamp * 1000));

  for (const newNumber of newNumbers) {
    await cypher.upsertContact(newNumber, timestamp);
    await cypher.upsertContactToGroupRelationship(newNumber, groupId, 'GROUP_MEMBER', timestamp);
  }
};

const messageHandler = async (eventData) => {
  //add AUTHORS_IN_GROUP relationship between contact and group, increase counter
  const timestamp = lib.formatDateTime(new Date(eventData.timestamp * 1000));
  const phoneNumber = idToPhone(eventData.author);
  const groupId = eventData.from;
  await cypher.upsertContact(phoneNumber, timestamp);
  await cypher.updateContactEngagedInGroupRelationship(phoneNumber, groupId, 'AUTHORS_IN_GROUP', timestamp);
};

const messageReactionHandler = async (eventData) => {
  const timestamp = lib.formatDateTime(new Date(eventData.timestamp * 1000));
  const phoneNumber = idToPhone(eventData.senderId);
  const groupId = eventData.id.remote;
  await cypher.upsertContact(phoneNumber, timestamp);
  await cypher.updateContactEngagedInGroupRelationship(phoneNumber, groupId, 'REACTS_IN_GROUP', timestamp);
};

module.exports = {
  getChatsHandler,
  getProfilesHandler,
  contactChangedHandler,
  groupLeaveHandler,
  groupJoinHandler,
  messageHandler,
  messageReactionHandler,
};
