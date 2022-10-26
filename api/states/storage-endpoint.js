const fs = require('fs-extra');
const path = require('path');
const { dataDir } = require('../libs/env');

const endpointFilePath = path.join(dataDir, 'endpoint.txt');
class StorageEndpointRepository {
  /**
   *
   * @returns {Promise<boolean>}
   */
  async exists() {
    return fs.existsSync(endpointFilePath);
  }

  /**
   *
   * @param {any} endpoint
   * @returns {Promise<void>}
   */
  async write(endpoint) {
    return fs.outputFile(endpointFilePath, endpoint);
  }

  /**
   *
   *
   * @return {Promise<string>}
   */
  async read() {
    const buffer = await fs.readFile(endpointFilePath);
    return buffer.toString();
  }
}

module.exports = {
  storageEndpointRepository: new StorageEndpointRepository(),
};
