const { Database } = require('@blocklet/sdk/lib/database');

/**
 * Data structure
 * - user: object
 *   - name: string
 *   - role: string
 *   - did: string
 * - remark: string
 * - size: number
 * - filename: string
 * - folderId: string
 * - minetype: string
 * - originalname: string
 * - createdAt: string
 * - updatedAt: string
 * - tags: string[]
 */

class Upload extends Database {
  constructor() {
    super('uploads');
  }
}

module.exports = new Upload();
