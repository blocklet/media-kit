const Database = require('@blocklet/sdk/lib/database');

/**
 * Data structure
 * - name: string
 * - imageCount: number
 * - createdAt: string
 * - updatedAt: string
 * - createdBy: string
 * - updatedBy: string
 */

class Folder extends Database {
  constructor() {
    super('folders');
  }
}

module.exports = new Folder();
