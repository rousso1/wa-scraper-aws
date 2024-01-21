const keys = require('./s3Keys');
const s3Helper = require('./s3-helper');
const config = require('./config');

const onGroupLeave = async (groupNotification) => {
  const key = keys.getGroupLeaveKey(groupNotification);
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify(groupNotification));
};

const onGroupJoin = async (groupNotification) => {
  const key = keys.getGroupJoinKey(groupNotification);
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify(groupNotification));
};
const onGroupMembershipRequest = (membershipRequest) => {
  const key = keys.getGroupMembershipRequestKey(membershipRequest);
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify(membershipRequest));
};

const onGroupUpdate = (groupUpdate) => {
  const key = keys.getGroupUpdateKey(groupUpdate);
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify(groupUpdate));
};

const onGroupAdminChange = (groupAdminChange) => {
  const key = keys.getGroupAdminChangeKey(groupAdminChange);
  return s3Helper.saveToS3(key, config.bucketName, JSON.stringify({ message, oldId, newId, isContact }));
};

module.exports = { onGroupLeave, onGroupJoin, onGroupMembershipRequest, onGroupUpdate, onGroupAdminChange };
