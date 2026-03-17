import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';

export const uploads = sqliteTable('uploads', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  originalname: text('originalname'),
  mimetype: text('mimetype'),
  size: integer('size'),
  remark: text('remark').default(''),
  folderId: text('folder_id'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => ({
  filenameIdx: index('idx_uploads_filename').on(table.filename),
  folderIdIdx: index('idx_uploads_folder_id').on(table.folderId),
  mimetypeIdx: index('idx_uploads_mimetype').on(table.mimetype),
  createdByIdx: index('idx_uploads_created_by').on(table.createdBy),
  createdAtIdx: index('idx_uploads_created_at').on(table.createdAt),
}));

export const uploadTags = sqliteTable('upload_tags', {
  uploadId: text('upload_id').notNull().references(() => uploads.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.uploadId, table.tag] }),
  tagIdx: index('idx_upload_tags_tag').on(table.tag, table.uploadId),
}));

export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => ({
  nameIdx: index('idx_folders_name').on(table.name),
}));

export const uploadSessions = sqliteTable('upload_sessions', {
  id: text('id').primaryKey(),
  uploadId: text('upload_id'),
  key: text('key').notNull(),
  finalKey: text('final_key'),
  totalSize: integer('total_size'),
  partSize: integer('part_size'),
  status: text('status').default('active'),
  createdBy: text('created_by'),
  createdAt: text('created_at'),
  expiresAt: text('expires_at'),
}, (table) => ({
  statusIdx: index('idx_upload_sessions_status').on(table.status),
  expiresIdx: index('idx_upload_sessions_expires').on(table.expiresAt),
}));
