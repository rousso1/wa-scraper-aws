class Client {
  constructor() {
    this.index = {};
  }

  async index(params) {
    const { index: indexName, body: document } = params;

    if (!this.index[indexName]) {
      this.index[indexName] = {};
    }

    // Generate a unique document id for mock purposes
    const documentId = Date.now().toString();

    this.index[indexName][documentId] = { ...document };

    return { body: { _id: documentId, _index: indexName, _type: '_doc', _version: 1, result: 'created' } };
  }
}

module.exports = Client;

// // Example usage:
// const openSearchMock = new OpenSearchMock();

// // Mock indexing
// const indexName = 'mock-index';
// const document = { field1: 'value1', field2: 'value2' };

// openSearchMock
//   .index({ index: indexName, body: document })
//   .then((result) => console.log('Indexing result:', result))
//   .catch((error) => console.error('Indexing error:', error));
