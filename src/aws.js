const AWS = require('aws-sdk');
const awsConfig = require('aws-config');
const config = require('./config');

AWS.config = awsConfig({ region: config.awsRegion, profile: config.awsProfile });

module.exports = AWS;
