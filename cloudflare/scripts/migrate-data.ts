/**
 * Data migration script: SQLite (Blocklet) → D1 (Cloudflare)
 *
 * Usage:
 *   npx tsx scripts/migrate-data.ts --source /path/to/media-kit.db --d1-name media-kit-db
 *
 * Prerequisites:
 *   - Source SQLite database from Blocklet Server
 *   - wrangler CLI authenticated with Cloudflare account
 *   - D1 database already created with schema (run db:migrate:remote first)
 */

import Database from 'better-sqlite3';

const SOURCE_DB_PATH = process.argv.find((_, i, a) => a[i - 1] === '--source') || '';
const D1_DB_NAME = process.argv.find((_, i, a) => a[i - 1] === '--d1-name') || 'media-kit-db';
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 50;

if (!SOURCE_DB_PATH) {
  console.error('Usage: npx tsx scripts/migrate-data.ts --source <path-to-sqlite-db> [--d1-name <name>] [--dry-run]');
  process.exit(1);
}

interface UploadRow {
  id: string;
  filename: string;
  originalname: string | null;
  mimetype: string | null;
  size: number | null;
  remark: string | null;
  tags: string | null;
  folderId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

interface FolderRow {
  id: string;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

async function d1Execute(sql: string, params: any[]) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] ${sql}`);
    console.log(`  params: ${JSON.stringify(params)}`);
    return;
  }

  const paramsJson = JSON.stringify(params);
  const { execSync } = await import('child_process');
  execSync(
    `wrangler d1 execute ${D1_DB_NAME} --remote --command "${sql.replace(/"/g, '\\"')}" --json`,
    {
      stdio: 'pipe',
      env: { ...process.env },
      input: paramsJson,
    },
  );
}

async function main() {
  console.log(`Opening source database: ${SOURCE_DB_PATH}`);
  const sourceDb = new Database(SOURCE_DB_PATH, { readonly: true });

  // Migrate uploads
  const uploads = sourceDb.prepare('SELECT * FROM uploads').all() as UploadRow[];
  console.log(`Found ${uploads.length} uploads to migrate`);

  let uploadCount = 0;
  for (let i = 0; i < uploads.length; i += BATCH_SIZE) {
    const batch = uploads.slice(i, i + BATCH_SIZE);
    for (const u of batch) {
      const stmt = `INSERT OR IGNORE INTO uploads (id,filename,originalname,mimetype,size,remark,folder_id,created_at,updated_at,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
      const params = [
        u.id,
        u.filename,
        u.originalname || '',
        u.mimetype || '',
        u.size || 0,
        u.remark || '',
        u.folderId || '',
        u.createdAt || '',
        u.updatedAt || '',
        u.createdBy || '',
        u.updatedBy || '',
      ];
      await d1Execute(stmt, params);

      // Migrate tags from JSON to upload_tags table
      try {
        const tags: string[] = JSON.parse(u.tags || '[]');
        for (const tag of tags) {
          if (tag) {
            await d1Execute(
              'INSERT OR IGNORE INTO upload_tags (upload_id, tag) VALUES (?, ?)',
              [u.id, tag],
            );
          }
        }
      } catch {
        // Invalid JSON tags, skip
      }

      uploadCount++;
    }
    console.log(`  Migrated ${Math.min(i + BATCH_SIZE, uploads.length)}/${uploads.length} uploads`);
  }

  // Migrate folders
  const folders = sourceDb.prepare('SELECT * FROM folders').all() as FolderRow[];
  console.log(`Found ${folders.length} folders to migrate`);

  for (const f of folders) {
    await d1Execute(
      'INSERT OR IGNORE INTO folders (id, name, created_at, updated_at, created_by, updated_by) VALUES (?,?,?,?,?,?)',
      [f.id, f.name, f.createdAt || '', f.updatedAt || '', f.createdBy || '', f.updatedBy || ''],
    );
  }

  sourceDb.close();

  console.log(`\nMigration complete!`);
  console.log(`  Uploads: ${uploadCount}`);
  console.log(`  Folders: ${folders.length}`);
  if (DRY_RUN) {
    console.log(`  (DRY RUN - no data was actually written)`);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
