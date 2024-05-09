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

export function initLocalStorageServer({
  path: _path,
  onUploadFinish: _onUploadFinish,
  onUploadCreate: _onUploadCreate,
  symlinkPath: _symlinkPath,
  express,
  expiredUploadTime = 1000 * 60 * 60 * 24 * 3, // default 3 days expire
  ...restProps
}: ServerOptions & {
  path: string;
  onUploadFinish?: Function;
  onUploadCreate?: Function;
  express: Function;
  symlinkPath?: Function | String | null;
  expiredUploadTime?: Number;
}) {
  const app = express();
  const configstore = new rewriteFileConfigstore(_path); // my configstore
  const datastore = new FileStore({
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
        absolutePath: path.resolve(_path, id),
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

    // handler dynamic path
    if (_symlinkPath) {
      const { id: fileName } = uploadMetadata || {};
      const currentFilePath = path.join(_path, fileName);
      let symlinkFilePath;

      if (typeof _symlinkPath === 'string') {
        symlinkFilePath = _symlinkPath;
      } else if (typeof _symlinkPath === 'function') {
        symlinkFilePath = await _symlinkPath?.(req, res, uploadMetadata);
      }

      if (typeof symlinkFilePath === 'string' && symlinkFilePath) {
        if (symlinkFilePath?.indexOf(fileName) === -1) {
          // symlinkFilePath may be not with fileName
          symlinkFilePath = path.join(symlinkFilePath, fileName);
        }

        try {
          await symlinkFileToNewPath(currentFilePath, symlinkFilePath);
          await symlinkFileToNewPath(`${currentFilePath}.json`, `${symlinkFilePath}.json`);
        } catch (error) {
          console.error('copy file error: ', error);
        }
      }
    }

    if (_onUploadFinish) {
      try {
        const result = await _onUploadFinish(req, res, uploadMetadata);
        return result;
      } catch (error) {
        // if onUploadFinish error, should delete the file and set not exist
        newServer.delete(uploadMetadata.id);
        res.setHeader('x-uploader-file-exist', false);
        throw error;
      }
    }
    return res;
  };

  const newServer = new Server({
    path: '/', // UNUSED
    relativeLocation: true,
    // respectForwardedHeaders: true,
    namingFunction,
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
          console.log('clean up expired uploads by cron');
          newServer.cleanUpExpiredUploads();
        },
        options: { runOnInit: true },
      },
    ],
    onError: (err: Error) => {
      console.error('run job failed', err);
    },
  });

  newServer.delete = async (key: string) => {
    // remove meta data
    await configstore.delete(key);
    // remove file
    await configstore.delete(key, false);
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

export const namingFunction = (req: any) => {
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
  }

  next?.();
}

export async function fileExistBeforeUpload(req: any, res: any, next?: Function) {
  let { method, uploaderProps } = req;

  method = method.toUpperCase();

  // check if file exists
  if (['PATCH', 'POST'].includes(method)) {
    const fileName = namingFunction(req);
    const filePath = path.join(uploaderProps.server.datastore.directory, fileName);
    const isExist = await fs.stat(filePath).catch(() => false);

    if (isExist) {
      const metaData = await getMetaDataByFilePath(filePath);

      // is upload exist and size enough
      if (isExist?.size >= 0 && isExist?.size === metaData?.size) {
        const prepareUpload = method === 'POST';

        if (prepareUpload) {
          res.status(200); // set 200 will be recognized by fontend component
          res.setHeader('Location', joinUrl(req.headers['x-uploader-base-url'], fileName));
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
          } catch (error) {
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
    } catch (error) {
      console.error('getMetaDataByPath error: ', error);
    }
  }
  return null;
}

export async function symlinkFileToNewPath(oldPath: string, newPath: string) {
  // newPath is not the same as oldPath
  if (newPath !== oldPath) {
    // create dir if not exists
    const dir = path.dirname(newPath);
    const dirExists = await fs.stat(dir).catch(() => false);

    if (!dirExists) {
      await fs.mkdir(dir, { recursive: true });
    }

    // check if file exists in dynamic path
    const newFileExists = await fs.stat(newPath).catch(() => false);

    if (!newFileExists) {
      let retryCount = 0;

      async function createSymlink() {
        // create symlink to newPath
        await fs.symlink(oldPath, newPath);

        // sleep 10ms * retryCount to wait for symlink file created
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(null);
          }, 10 * retryCount);
        });

        // check if symlink file exists
        const isExist = await fs.readFile(newPath).catch(() => false);

        // if symlink file not exists, try again, max 3 times
        if (!isExist && retryCount < 3) {
          retryCount += 1;
          // if symlink file not exists, try again
          await createSymlink();
        }
      }

      await createSymlink();
    }
  }
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
class rewriteFileConfigstore {
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
    // no recording run time
    if (value?.runtime) {
      delete value.runtime;
    }
    if (value?.metadata?.runtime) {
      delete value.metadata.runtime;
    }
    await this.queue.add(() => fs.writeFile(this.resolve(key), JSON.stringify(value)));
  }

  async safeDeleteFile(filePath: string): Promise<void> {
    try {
      const isExist = await fs.stat(filePath).catch(() => false);
      if (isExist) {
        await fs.rm(filePath);
      } else {
        console.log('Can not remove file, the file not exist: ', filePath);
      }
    } catch (error) {
      // ignore error
    }
  }

  async delete(key: string, isMetadata = true): Promise<void> {
    try {
      await this.queue.add(() => this.safeDeleteFile(this.resolve(key, isMetadata)));
    } catch (error) {
      // ignore error
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
    return path.resolve(this.directory, fileKey);
  }
}
