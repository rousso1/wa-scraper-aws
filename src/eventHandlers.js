const cypher = require('./cypherQueries');
const lib = require('./lib');

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

const formatTime = (time) => {
  if (typeof time === 'undefined' || time === 0) {
    return '';
  }

  if (!isNaN(time)) {
    return lib.formatDateTime(new Date(time));
  }

  return time;
};

const getGroupFields = (groupId, chat) => {
  const metaData = chat.groupMetadata;
  // Use a regular expression to match invisible characters
  const regex = /[\p{Cf}]/gu;

  const fields = {
    groupId,
    createDate: lib.formatDateTime(new Date(metaData.creation * 1000)),
    subject: metaData.subject?.replace(regex, '') || '',
    subjectTime: formatTime(metaData.subjectTime),
    description: metaData.desc?.replace(regex, '') || '',
    descriptionTime: formatTime(metaData.descTime),
    descriptionSetBy: metaData.descOwner ? idToPhone(metaData.descOwner._serialized) : '',
    memberAddMode: metaData.memberAddMode || '',

    // groupPicture: chat.groupPicture,
  };
  const hash = lib.getHash(Object.values(fields).join(''));
  fields.hash = hash;
  return fields;
};

const getChatsHandler = async (eventData, session) => {
  if (!eventData.isGroup) {
    return;
  }
  const newMembers = getParticipantsNumbers(eventData, false);
  const newAdmins = getParticipantsNumbers(eventData, true);
  const groupId = eventData.id._serialized;
  const timestamp = lib.formatDateTime(new Date(eventData.timestamp * 1000));
  //TODO: assert these are received as arrays
  const currentMembers = await cypher.getContactsWithGroupRelationships(session, groupId, 'GROUP_MEMBER');
  const currentAdmins = await cypher.getContactsWithGroupRelationships(session, groupId, 'GROUP_ADMIN');

  await cypher.upsertGroup(session, groupId, getGroupFields(groupId, eventData));

  for (const currentMember of currentMembers) {
    if (!newMembers.includes(currentMember)) {
      //those numbers left the group
      await cypher.deleteContactToGroupRelationship(session, currentMember, groupId, 'GROUP_MEMBER', timestamp);
      await cypher.upsertContactToGroupRelationship(session, currentMember, groupId, 'WAS_GROUP_MEMBER', timestamp);
    }
  }

  for (const currentAdmin of currentAdmins) {
    if (!newAdmins.includes(currentAdmin)) {
      //those numbers are no longer admins
      await cypher.deleteContactToGroupRelationship(session, currentAdmin, groupId, 'GROUP_ADMIN', timestamp);
      await cypher.upsertContactToGroupRelationship(session, currentAdmin, groupId, 'WAS_GROUP_ADMIN', timestamp);
    }
  }

  for (const newAdmin of newAdmins) {
    if (!currentAdmins.includes(newAdmin)) {
      await cypher.upsertContact(session, newAdmin, timestamp);
    }

    //run even if exists so timestamp will be updated
    await cypher.upsertContactToGroupRelationship(session, newAdmin, groupId, 'GROUP_MEMBER', timestamp);
  }

  for (const newMember of newMembers) {
    if (!currentMembers.includes(newMember)) {
      await cypher.upsertContact(session, newMember, timestamp);
    }

    //run even if exists so timestamp will be updated
    await cypher.upsertContactToGroupRelationship(session, newMember, groupId, 'GROUP_MEMBER', timestamp);
  }
};

const gotProfileHandler = async (eventData, session) => {
  const profile = eventData.profile;
  if (identifiedOnly(eventData.profile)) {
    const timestamp = lib.formatDateTime(new Date());
    await cypher.upsertContact(session, idToPhone(profile.id._serialized), timestamp, profile.pushname);
  }
};

const contactChangedHandler = async (eventData, session) => {
  const oldNumber = idToPhone(eventData.oldId);
  const newNumber = idToPhone(eventData.newId);
  const timestamp = lib.formatDateTime(new Date(eventData.message.timestamp * 1000));

  await cypher.upsertContact(session, oldNumber, timestamp);
  await cypher.upsertContact(session, newNumber, timestamp);
  await cypher.upsertContactToContactRelationship(session, oldNumber, newNumber, 'CHANGED_TO', timestamp);
};

const groupLeaveHandler = async (eventData, session) => {
  const leavingNumbers = eventData.recipientIds.map(idToPhone);
  const groupId = eventData.chatId;
  const timestamp = lib.formatDateTime(new Date(eventData.timestamp * 1000));

  for (const leavingNumber of leavingNumbers) {
    await cypher.deleteContactToGroupRelationship(session, leavingNumber, groupId, 'GROUP_MEMBER', timestamp);
    await cypher.upsertContactToGroupRelationship(session, leavingNumber, groupId, 'WAS_GROUP_MEMBER', timestamp);
  }
};

const groupJoinHandler = async (eventData, session) => {
  const newNumbers = eventData.recipientIds.map(idToPhone);
  const groupId = eventData.chatId;
  const timestamp = lib.formatDateTime(new Date(eventData.timestamp * 1000));

  for (const newNumber of newNumbers) {
    await cypher.upsertContact(session, newNumber, timestamp);
    await cypher.upsertContactToGroupRelationship(session, newNumber, groupId, 'GROUP_MEMBER', timestamp);
  }
};

const messageHandler = async (eventData, session) => {
  //add AUTHORS_IN_GROUP relationship between contact and group, increase counter
  const timestamp = lib.formatDateTime(new Date(eventData.timestamp * 1000));
  const phoneNumber = idToPhone(eventData.author);
  const groupId = eventData.from;
  await cypher.upsertContact(session, phoneNumber, timestamp);
  await cypher.updateContactEngagedInGroupRelationship(session, phoneNumber, groupId, 'AUTHORS_IN_GROUP', timestamp);
};

const messageReactionHandler = async (eventData, session) => {
  const timestamp = lib.formatDateTime(new Date(eventData.timestamp * 1000));
  const phoneNumber = idToPhone(eventData.senderId);
  const groupId = eventData.id.remote;
  await cypher.upsertContact(session, phoneNumber, timestamp);
  await cypher.updateContactEngagedInGroupRelationship(session, phoneNumber, groupId, 'REACTS_IN_GROUP', timestamp);
};

module.exports = {
  getChatsHandler,
  gotProfileHandler,
  contactChangedHandler,
  groupLeaveHandler,
  groupJoinHandler,
  messageHandler,
  messageReactionHandler,
};
