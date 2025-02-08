import { type ServerOptions } from '@tus/server';
const { Server, EVENTS } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const cron = require('@abtnode/cron');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');
const joinUrlLib = require('url-join');
const { default: queue } = require('p-queue');
const { setPDFDownloadHeader, logger } = require('../utils');

const validFilePathInDirPath = (dirPath: string, filePath: string) => {
  const fileName = path.basename(filePath);
  if (!filePath.startsWith(dirPath) || path.join(dirPath, fileName) !== filePath) {
    logger.error('Invalid file path: ', filePath);
    throw new Error('Invalid file path');
  }
  return true;
};

export function initLocalStorageServer({
  path: _path,
  onUploadFinish: _onUploadFinish,
  onUploadCreate: _onUploadCreate,
  express,
  expiredUploadTime = 1000 * 60 * 60 * 24 * 3, // default 3 days expire
  ...restProps
}: ServerOptions & {
  path: string;
  onUploadFinish?: Function;
  onUploadCreate?: Function;
  express: Function;
  expiredUploadTime?: Number;
}) {
  const app = express();
  const configstore = new RewriteFileConfigstore(_path); // my configstore

  const datastore = new RewriteFileStore({
    directory: _path,
    expirationPeriodInMilliseconds: expiredUploadTime,
    configstore,
  });

  const formatMetadata = (uploadMetadata: any) => {
    const cloneUploadMetadata = {
      ...uploadMetadata,
    };

    // remove the dir path to get real file name
    if (
      cloneUploadMetadata.metadata?.name?.indexOf('/') > -1 &&
      cloneUploadMetadata.metadata?.relativePath?.indexOf('/') > -1
    ) {
      cloneUploadMetadata.metadata.name = cloneUploadMetadata.metadata.name.split('/').pop();
      cloneUploadMetadata.metadata.filename = cloneUploadMetadata.metadata.name;
    }

    // exist id but not runtime
    if (cloneUploadMetadata.id && !cloneUploadMetadata.runtime) {
      const { id, metadata, size } = cloneUploadMetadata;
      cloneUploadMetadata.runtime = {
        relativePath: metadata?.relativePath,
        absolutePath: path.join(_path, id),
        size,
        hashFileName: id,
        originFileName: metadata?.filename,
        type: metadata?.type,
        fileType: metadata?.filetype,
      };
    }
    return cloneUploadMetadata;
  };

  const rewriteMetaDataFile = async (uploadMetadata: any) => {
    uploadMetadata = formatMetadata(uploadMetadata);
    const { id } = uploadMetadata;
    if (!id) {
      return;
    }
    const oldMetadata = formatMetadata(await configstore.get(id));
    // should rewrite meta data file
    if (JSON.stringify(oldMetadata) !== JSON.stringify(uploadMetadata)) {
      await configstore.set(id, uploadMetadata);
    }
  };

  const onUploadCreate = async (req: any, res: any, uploadMetadata: any) => {
    uploadMetadata = formatMetadata(uploadMetadata);

    // check offset
    await rewriteMetaDataFile(uploadMetadata);

    // resolve the bug of upload empty file, otherwise will be upload twice
    if (uploadMetadata.offset === 0 && uploadMetadata.size === 0) {
      res.status(200); // set 200 will be recognized by frontend component
      res.setHeader('Location', joinUrl(req.headers['x-uploader-base-url'], uploadMetadata.id));
      res.setHeader('Upload-Offset', 0);
      res.setHeader('Upload-Length', 0);
      res.setHeader('x-uploader-file-exist', true);
    }

    if (_onUploadCreate) {
      const result = await _onUploadCreate(req, res, uploadMetadata);
      return result;
    }

    return res;
  };

  const onUploadFinish = async (req: any, res: any, uploadMetadata: any) => {
    // set file exist header, for frontend to check
    res.setHeader('x-uploader-file-exist', true);

    uploadMetadata = formatMetadata(uploadMetadata);

    // check offset
    await rewriteMetaDataFile(uploadMetadata);

    if (_onUploadFinish) {
      try {
        const result = await _onUploadFinish(req, res, uploadMetadata);
        return result;
      } catch (err) {
        logger.error('@blocklet/uploader: onUploadFinish error: ', err);
        // if onUploadFinish error, should delete the file and set not exist
        newServer.delete(uploadMetadata.id);
        res.setHeader('x-uploader-file-exist', false);
        throw err;
      }
    }
    return res;
  };

  const newServer = new Server({
    path: '/', // UNUSED
    relativeLocation: true,
    // respectForwardedHeaders: true,
    namingFunction: (req: any) => {
      const fileName = getFileName(req);

      const filePath = path.join(_path, fileName);

      validFilePathInDirPath(_path, filePath);

      return fileName;
    },
    datastore,
    onUploadFinish: async (req: any, res: any, uploadMetadata: any) => {
      uploadMetadata = formatMetadata(uploadMetadata);

      const result = await onUploadFinish(req, res, uploadMetadata);

      // result can be res or value
      if (result && !result.send) {
        const body = typeof result === 'string' ? result : JSON.stringify(result);
        throw { body, status_code: 200 };
      } else {
        return result;
      }
    },
    onUploadCreate,
    ...restProps,
  });

  // record uploaderProps
  app.use((req: any, res: any, next: Function) => {
    req.uploaderProps = {
      server: newServer,
      onUploadFinish,
      onUploadCreate,
    };
    next();
  });

  // add cron init
  cron.init({
    context: {},
    jobs: [
      {
        name: 'auto-cleanup-expired-uploads',
        time: '0 0 * * * *', // each hour
        fn: () => {
          try {
            newServer
              .cleanUpExpiredUploads()
              .then((count: number) => {
                logger.info(`@blocklet/uploader: cleanup expired uploads done: ${count}`);
              })
              .catch((err: Error) => {
                logger.error(`@blocklet/uploader: cleanup expired uploads error`, err);
              });
          } catch (err: any) {
            logger.error(`@blocklet/uploader: cleanup expired uploads error`, err);
          }
        },
        options: { runOnInit: false },
      },
    ],
    onError: (err: Error) => {
      logger.error('@blocklet/uploader: cleanup job failed', err);
    },
  });

  newServer.delete = async (key: string) => {
    try {
      // remove meta data
      await configstore.delete(key);
      // remove file
      await configstore.delete(key, false);
    } catch (err) {
      logger.error('@blocklet/uploader: delete error: ', err);
    }
  };

  // Each Patch req finish will trigger
  newServer.on(EVENTS.POST_RECEIVE, async (req: any, res: any, uploadMetadata: any) => {
    uploadMetadata = formatMetadata(uploadMetadata);
    await rewriteMetaDataFile(uploadMetadata);
  });

  app.all('*', setHeaders, fileExistBeforeUpload, newServer.handle.bind(newServer));

  newServer.handle = app;

  return newServer;
}

export const getFileName = (req: any) => {
  const ext = req.headers['x-uploader-file-ext'];
  const randomName = `${crypto.randomBytes(16).toString('hex')}${ext ? `.${ext}` : ''}`;
  return req.headers['x-uploader-file-name'] || randomName; // use a random name
};

export function getFileNameParam(
  req: any,
  res: any,
  { isRequired = true } = {} as {
    isRequired: boolean;
  }
) {
  let { fileName } = req.params;

  if (!fileName) {
    // try to get from url
    fileName = req.originalUrl.replace(req.baseUrl, '');
  }

  if (!fileName && isRequired) {
    res.status(400).json({ error: 'Parameter "fileName" is required' });
    return;
  }

  return fileName;
}

export function getLocalStorageFile({ server }: any) {
  return async (req: any, res: any, next: any) => {
    // get file name
    const fileName = getFileNameParam(req, res);
    const filePath = path.join(server.datastore.directory, fileName);

    validFilePathInDirPath(server.datastore.directory, filePath);

    // check if file exists
    const fileExists = await fs.stat(filePath).catch(() => false);

    if (!fileExists) {
      res.status(404).json({ error: 'file not found' });
      return;
    }

    // set content type
    setHeaders(req, res);

    const file = await fs.readFile(filePath);
    res.send(file);

    next?.();
  };
}

export function setHeaders(req: any, res: any, next?: Function) {
  let { method } = req;

  method = method.toUpperCase();

  // get file name
  const fileName = getFileNameParam(req, res, {
    isRequired: false,
  });

  if (req.headers['x-uploader-endpoint-url']) {
    // get query from x-uploader-endpoint-url
    const query = new URL(req.headers['x-uploader-endpoint-url']).searchParams;
    req.query = {
      ...Object.fromEntries(query), // query params convert to object
      ...req.query,
    };
  }

  // resolve the bug of after nginx proxy missing prefix bug, cause Location baseUrl Error
  if (method === 'POST' && req.headers['x-uploader-base-url']) {
    req.baseUrl = req.headers['x-uploader-base-url'];
  }

  if (method === 'GET' && fileName) {
    // set content type with file name
    const contentType = mime.lookup(fileName);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // set pdf download header if it's a pdf
    setPDFDownloadHeader(req, res);
  }

  next?.();
}

export async function fileExistBeforeUpload(req: any, res: any, next?: Function) {
  let { method, uploaderProps } = req;

  method = method.toUpperCase();

  // check if file exists
  if (['PATCH', 'POST'].includes(method)) {
    const _path = uploaderProps.server.datastore.directory;
    const fileName = getFileName(req);
    const filePath = path.join(_path, fileName);

    validFilePathInDirPath(_path, filePath);

    const isExist = await fs.stat(filePath).catch(() => false);

    if (isExist) {
      const metaData = await getMetaDataByFilePath(filePath);

      // is upload exist and size enough
      if (isExist?.size >= 0 && isExist?.size === metaData?.size) {
        const prepareUpload = method === 'POST';

        if (prepareUpload) {
          res.status(200); // set 200 will be recognized by frontend component
          res.setHeader('Location', joinUrl(req.headers['x-uploader-base-url'], fileName));
          res.setHeader('Upload-Offset', +metaData.offset);
          res.setHeader('Upload-Length', +metaData.size);
        }

        // must: get real metadata from header, avoid the bug of exist file metadata
        if (req.headers['x-uploader-metadata']) {
          try {
            const realMetaData = JSON.parse(req.headers['x-uploader-metadata'], (key, value) => {
              if (typeof value === 'string') {
                return decodeURIComponent(value);
              }
              return value;
            });

            metaData.metadata = {
              ...metaData.metadata,
              ...realMetaData,
            };
          } catch (err) {
            logger.error('@blocklet/uploader: parse metadata error: ', err);
            // ignore
          }
        }

        const uploadResult = await uploaderProps.onUploadFinish(req, res, metaData);
        res.json(uploadResult);

        return;
      }
    }
  }

  next?.();
}

export async function getMetaDataByFilePath(filePath: string) {
  const metaDataPath = `${filePath}.json`;
  const isExist = await fs.stat(filePath).catch(() => false);
  if (isExist) {
    try {
      const metaData = await fs.readFile(metaDataPath, 'utf-8');
      const metaDataJson = JSON.parse(metaData);
      return metaDataJson;
    } catch (err) {
      logger.error('@blocklet/uploader: getMetaDataByPath error: ', err);
    }
  }
  return null;
}

export function joinUrl(...args: string[]) {
  const realArgs = args.filter(Boolean).map((item) => {
    if (item === '/') {
      return '';
    }
    return item;
  });
  return joinUrlLib(...realArgs);
}

/**
 * FileConfigstore writes the `Upload` JSON metadata to disk next the uploaded file itself.
 * It uses a queue which only processes one operation at a time to prevent unsafe concurrent access.
 */
class RewriteFileConfigstore {
  directory: string;
  queue: any;

  constructor(path: string) {
    this.directory = path;
    this.queue = new queue({ concurrency: 1 });
  }

  async get(key: string) {
    try {
      const buffer = await this.queue.add(() => fs.readFile(this.resolve(key), 'utf8'));
      const metadata = JSON.parse(buffer as string);
      // get real offset by file
      if (metadata.offset !== metadata.size) {
        // get file info
        const info = await fs.stat(this.resolve(key, false)).catch(() => false);
        if (info?.size !== metadata?.offset) {
          metadata.offset = info.size;
          // rewrite metadata
          this.set(key, metadata);
        }
      }
      return metadata;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: any) {
    // no recording runtime
    if (value?.runtime) {
      delete value.runtime;
    }
    if (value?.metadata?.runtime) {
      delete value.metadata.runtime;
    }
    await this.queue.add(() => fs.writeFile(this.resolve(key), JSON.stringify(value)));
  }

  async safeDeleteFile(filePath: string): Promise<void> {
    validFilePathInDirPath(this.directory, filePath);

    try {
      const isExist = await fs.stat(filePath).catch(() => false);

      if (isExist) {
        await fs.rm(filePath);
      } else {
        logger.log('Can not remove file, the file not exist: ', filePath);
      }
    } catch (err) {
      logger.error('@blocklet/uploader: safeDeleteFile error: ', err);
    }
  }

  async delete(key: string, isMetadata = true): Promise<void> {
    try {
      await this.queue.add(() => this.safeDeleteFile(this.resolve(key, isMetadata)));
    } catch (err) {
      logger.error('@blocklet/uploader: delete error: ', err);
    }
  }

  async list(): Promise<Array<string>> {
    return this.queue.add(async () => {
      const files = await fs.readdir(this.directory, { withFileTypes: true });
      const promises = files
        .filter((file: any) => file.isFile() && file.name.endsWith('.json'))
        .map((file: any) => {
          // return filename not meta json
          return file.name.replace('.json', '');
        });

      return Promise.all(promises);
    }) as Promise<string[]>;
  }

  private resolve(key: string, isMetadata = true): string {
    let fileKey = key;
    // must use meta json file
    if (isMetadata) {
      fileKey = `${key}.json`;
    }
    return path.join(this.directory, fileKey);
  }
}

class RewriteFileStore extends FileStore {
  constructor(options: any) {
    super(options);
  }
  async remove(key: string) {
    // remove metadata
    this.configstore.delete(key);
    // remove file
    this.configstore.delete(key, false);
  }
}
