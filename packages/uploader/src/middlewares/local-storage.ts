const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');
const joinUrl = require('url-join');

export function initLocalStorageServer({
  path: _path,
  onUploadFinish: _onUploadFinish,
  symlinkPath: _symlinkPath,
  express,
  ...restProps
}: {
  path: string;
  onUploadFinish?: Function;
  express: Function;
  symlinkPath?: Function | String | null;
}) {
  const app = express();
  const datastore = new FileStore({ directory: _path });
  const onUploadFinish = async (req: any, res: any, uploadMetadata: any) => {
    // handle dynamic path
    if (_symlinkPath) {
      const { id: fileName } = uploadMetadata || {};
      const currentFilePath = path.join(newServer.datastore.directory, fileName);
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
      const result = await _onUploadFinish(req, res, uploadMetadata);
      return result;
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
      const result = await onUploadFinish(req, res, uploadMetadata);
      // result can be res or value
      if (result && !result.send) {
        const body = typeof result === 'string' ? result : JSON.stringify(result);
        throw { body, status_code: 200 };
      } else {
        return result;
      }
    },
    ...restProps,
  });

  // record uploaderProps
  app.use((req: any, res: any, next: Function) => {
    req.uploaderProps = {
      server: newServer,
      onUploadFinish,
    };
    next();
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
      if (isExist?.size > 0 && isExist?.size === metaData?.size) {
        res.setHeader('x-uploader-file-exist', true);

        const prepareUpload = method === 'POST';

        if (prepareUpload) {
          res.status(200); // set 200 will be recognized by fontend component
          res.setHeader('Location', joinUrlPlus(req.headers['x-uploader-base-url'], fileName));
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
      // create symlink to newPath
      await fs.symlink(oldPath, newPath);
    }
  }
}

export function joinUrlPlus(...args: string[]) {
  const realArgs = args.filter(Boolean).map((item) => {
    if (item === '/') {
      return '';
    }
    return item;
  });
  return joinUrl(...realArgs);
}
