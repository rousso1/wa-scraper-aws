const neo4j = require('neo4j-driver');
const config = require('./config');
const driver = neo4j.driver(config.neo4jUri, neo4j.auth.basic(config.neo4jUser, config.neo4jPass));
const session = driver.session();

const getHash = (str, len = 15) => {
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  return hash.substring(0, len);
};

const setPhrase = (paramName, fields) => {
  Object.entries(fields)
    .map((key, value) => {
      return `${paramName}.${key}='${value}'`;
    })
    .join(', ');
};

const executeQueries = async (queries) => {
  const results = [];
  for (const query of queries) {
    console.log(query);
    results.push(await session.run(query));
  }

  return results;
};

const upsertContact = async (phoneNumber, pushName) => {
  const fields = {
    hash: getHash(phoneNumber),
  };

  if (pushName) {
    fields.pushName = pushName;
  }

  return executeQueries([
    `MERGE (c:WhatsappContact {phoneNumber: '${phoneNumber}'}) 
     ON CREATE SET ${setPhrase('c', fields)}`,

    `MATCH (p:Phone {hash: '${fields.hash}'})
     MATCH (c:WhatsappContact {hash: '${fields.hash}'})
     MERGE (p)-[:HAS_WHATSAPP]->(c)`,
  ]);
};

const upsertContactToGroupRelationship = async (phoneNumber, groupId, relationshipName, timestamp) => {
  return executeQueries([
    `MATCH (c:WhatsappContact {phoneNumber: '${phoneNumber}'})
     MATCH (g:WhatsappGroup {groupId: '${groupId}'})
     MERGE (c)-[c2g:${relationshipName.toUpperCase()}]->(g)
     ON CREATE SET c2g.source='Whatsapp',c2g.timestamp='${timestamp}'`,
  ]);
};

const upsertContactToContactRelationship = async (fromNumber, toNumber, relationshipName, timestamp) => {
  return executeQueries([
    `MATCH (c1:WhatsappContact {phoneNumber: '${fromNumber}'})
     MATCH (c2:WhatsappContact {phoneNumber: '${toNumber}'})
     MERGE (c1)-[c2c:${relationshipName.toUpperCase()}]->(c2)
     ON CREATE SET c2c.source='Whatsapp',c2c.timestamp='${timestamp}'`,
  ]);
};

const deleteContactToGroupRelationship = async (phoneNumber, groupId, relationshipName) => {
  return executeQueries([
    `MATCH (c:WhatsappContact)-[r:${relationshipName.toUpperCase()}]->(g:WhatsappGroup)
     WHERE c.phoneNumber = '${phoneNumber}' AND g.groupId = '${groupId}'
     DELETE r;`,
  ]);
};

const getContactsWithGroupRelationships = async (groupId, relationshipName) => {
  return executeQueries([
    `MATCH (c:WhatsappContact)-[r:${relationshipName.toUpperCase()}]->(g:WhatsappGroup)
     WHERE g.groupId='${groupId}'
     RETURN c.phoneNumber;`,
  ]);

  //return a list of phoneNumbers of contacts with the specified relationship to the specified groupId
};
const upsertGroup = async (chat) => {};

module.exports = {
  upsertContact,
  upsertGroup,
  upsertContactToGroupRelationship,
  upsertContactToContactRelationship,
  deleteContactToGroupRelationship,
  getContactsWithGroupRelationships,
};
