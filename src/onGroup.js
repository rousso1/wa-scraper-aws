const keys = require('./s3Keys');
const s3Helper = require('./s3-helper');
const config = require('./config');
const stats = require('./stats');

const onGroupLeave = async (groupNotification) => {
  const eventName = 'group_leave';
  stats.report(eventName);
  const key = keys.getGroupLeaveKey(groupNotification);
  groupNotification.eventName = eventName;
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify(groupNotification));
};

const onGroupJoin = async (groupNotification) => {
  const eventName = 'group_join';
  stats.report(eventName);
  const key = keys.getGroupJoinKey(groupNotification);
  groupNotification.eventName = eventName;
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify(groupNotification));
};
const onGroupMembershipRequest = (membershipRequest) => {
  const eventName = 'group_membership_request';
  stats.report(eventName);
  const key = keys.getGroupMembershipRequestKey(membershipRequest);
  membershipRequest.eventName = eventName;
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify(membershipRequest));
};

const onGroupUpdate = (groupUpdate) => {
  const eventName = 'group_update';
  stats.report(eventName);
  const key = keys.getGroupUpdateKey(groupUpdate);
  groupUpdate.eventName = eventName;
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify(groupUpdate));
};

const onGroupAdminChange = (groupAdminChange) => {
  const eventName = 'group_admin_changed';
  stats.report(eventName);
  const key = keys.getGroupAdminChangeKey(groupAdminChange);
  groupAdminChange.eventName = eventName;
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify({ message, oldId, newId, isContact }));
};

module.exports = { onGroupLeave, onGroupJoin, onGroupMembershipRequest, onGroupUpdate, onGroupAdminChange };
