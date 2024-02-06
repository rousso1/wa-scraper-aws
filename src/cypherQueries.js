const neo4j = require('neo4j-driver');
const config = require('./config');
const driver = neo4j.driver(config.neo4jUri, neo4j.auth.basic(config.neo4jUser, config.neo4jPass));
const lib = require('./lib');

const relationshipSource = 'Whatsapp';

(async () => {
  //run once:
  const serverInfo = await driver.getServerInfo('neo4j');
  console.log(`serverInfo: ${JSON.stringify(serverInfo)}`);
  console.log(`Sample neo4j result: ${JSON.stringify(await driver.executeQuery('MATCH (n) RETURN n LIMIT 1;'))}`);
})();

const setPhrase = (paramName, fields) => {
  return Object.keys(fields)
    .map((key) => {
      return `${paramName}.${key}=$${key}`;
    })
    .join(', ');
};

const executeQueries = async (queries, params) => {
  const results = [];
  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });

  for (const query of queries) {
    console.log(query);
    // await fs.promises.appendFile('./queries-log.cypher', query + '\n\n', { encoding: 'utf-8' });
    // results.push(await session.executeWrite(query, params || {}));
    console.log('ATTEMPTING:', query, JSON.stringify(params || {}));
    // results.push(await driver.executeQuery(query, params || {}));
    // results.push(await session.executeWrite((tx) => tx.run(query, params)));
    results.push(await session.run(query, params || {}));
  }
  session.close();
  return results;
};

const upsertContact = async (phoneNumber, timestamp, pushName) => {
  const fields = {
    hash: lib.getHash(phoneNumber),
  };

  if (pushName) {
    fields.pushName = pushName;
  }

  return executeQueries(
    [
      `MERGE (c:WhatsappContact {phoneNumber: $phoneNumber}) 
     ON CREATE SET ${setPhrase('c', fields)}
     ON MATCH SET ${setPhrase('c', fields)};`,

      `MATCH (p:Phone {hash: $hash})
     MATCH (c:WhatsappContact {hash: $hash})
     MERGE (p)-[r:HAS_WHATSAPP]->(c)
     ON CREATE SET r.source = $relationshipSource, r.timestamp = $timestamp;`,
    ],
    Object.assign(fields, { relationshipSource, timestamp, phoneNumber })
  );
};

const upsertGroup = async (groupId, fields) => {
  return executeQueries(
    [
      `MERGE (g:WhatsappGroup {groupId: $groupId})
     ON CREATE SET ${setPhrase('g', fields)}
     ON MATCH SET ${setPhrase('g', fields)};`,
    ],
    Object.assign(fields, { groupId })
  );
};

const upsertContactToGroupRelationship = async (phoneNumber, groupId, relationshipName, timestamp) => {
  return executeQueries(
    [
      `MATCH (c:WhatsappContact {phoneNumber: $phoneNumber})
     MATCH (g:WhatsappGroup {groupId: $groupId})
     MERGE (c)-[c2g:${relationshipName.toUpperCase()}]->(g)
     ON CREATE SET c2g.source = $relationshipSource, c2g.timestamp = $timestamp;`,
    ],
    { phoneNumber, groupId, relationshipSource, timestamp }
  );
};

const updateContactEngagedInGroupRelationship = async (phoneNumber, groupId, relationshipName, timestamp) => {
  return executeQueries(
    [
      `MATCH (c:WhatsappContact {phoneNumber: $phoneNumber})
     MATCH (g:WhatsappGroup {groupId: $groupId})
     MERGE (c)-[r:${relationshipName.toUpperCase()}]->(g)
     ON CREATE SET r.counter = 1, r.timestamp=$timestamp, r.source=$relationshipSource
     ON MATCH SET r.counter = r.counter + 1, r.lastUpdate = $timestamp;`,
    ],
    { phoneNumber, groupId, timestamp, relationshipSource }
  );
};

const upsertContactToContactRelationship = async (fromNumber, toNumber, relationshipName, timestamp) => {
  return executeQueries(
    [
      `MATCH (c1:WhatsappContact {phoneNumber: $fromNumber})
     MATCH (c2:WhatsappContact {phoneNumber: $toNumber})
     MERGE (c1)-[c2c:${relationshipName.toUpperCase()}]->(c2)
     ON CREATE SET c2c.source = $relationshipSource, c2c.timestamp = $timestamp;`,
    ],
    { fromNumber, toNumber, relationshipSource, timestamp }
  );
};

const deleteContactToGroupRelationship = async (phoneNumber, groupId, relationshipName) => {
  return executeQueries(
    [
      `MATCH (c:WhatsappContact)-[r:${relationshipName.toUpperCase()}]->(g:WhatsappGroup)
     WHERE c.phoneNumber = $phoneNumber AND g.groupId = $groupId
     DELETE r;`,
    ],
    { phoneNumber, groupId }
  );
};

const getContactsWithGroupRelationships = async (groupId, relationshipName) => {
  //return a list of phoneNumbers of contacts with the specified relationship to the specified groupId
  const result = (
    await executeQueries(
      [
        `MATCH (c:WhatsappContact)-[r:${relationshipName.toUpperCase()}]->(g:WhatsappGroup)
     WHERE g.groupId = $groupId
     RETURN c.phoneNumber;`,
      ],
      { groupId }
    )
  )[0];
  const phoneNumbers = result.records.map((record) => record.get('c.phoneNumber'));
  return phoneNumbers;
};

module.exports = {
  upsertContact,
  upsertGroup,
  upsertContactToGroupRelationship,
  upsertContactToContactRelationship,
  deleteContactToGroupRelationship,
  getContactsWithGroupRelationships,
  updateContactEngagedInGroupRelationship,
};
