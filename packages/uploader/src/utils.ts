import { createAxios } from '@blocklet/js-sdk';
import joinUrl from 'url-join';
import mime from 'mime-types';
import debounce from 'lodash/debounce';
export const getObjectURL = (fileBlob: Blob) => {
  let url = null;
  if (!fileBlob || !isBlob(fileBlob)) {
    return null;
  }
  // @ts-ignore
  if (window?.createObjectURL) {
    // @ts-ignore
    url = window.createObjectURL(fileBlob);
  } else if (window?.URL?.createObjectURL) {
    url = window.URL.createObjectURL(fileBlob);
  } else if (window?.webkitURL?.createObjectURL) {
    url = window.webkitURL.createObjectURL(fileBlob);
  }
  return url;
};

export const getExt = (uppyFile: any) => {
  const { type, name } = uppyFile;

  // such as .DS_Store and .gitignore
  if (name.startsWith('.') && !mime.lookup(name)) {
    return false;
  }

  const nameContentType = mime.lookup(name);

  if (nameContentType) {
    return mime.extension(nameContentType) || '';
  }

  return mime.extension(type);
};

export function isBlob(file: any) {
  return file instanceof Blob;
}

export function blobToFile(blob: Blob, fileName: string) {
  const file = new File([blob], fileName, { type: blob.type });
  return file;
}

export function base64ToFile(base64: string, fileName: string) {
  let arr = base64.split(','),
    type = arr[0].match(/:(.*?);/)?.[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type });
}

export function getDownloadUrl(src: string) {
  const url = new URL(src);
  url.searchParams.delete('w');
  url.searchParams.delete('h');
  url.searchParams.delete('q');
  return url.href;
}

export const getAIKitComponent = () =>
  // @ts-ignore
  window?.blocklet?.componentMountPoints?.find((item: any) => item.did === 'z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ');

export const getMediaKitComponent = () =>
  // @ts-ignore
  window?.blocklet?.componentMountPoints?.find((item: any) => item.did === 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9');

export const isMediaKit = () =>
  // @ts-ignore
  window?.blocklet?.componentId.indexOf('z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9') > -1;

// @ts-ignore
export const mediaKitMountPoint = getMediaKitComponent()?.mountPoint || '/';

// @ts-ignore
export let prefixPath = mediaKitMountPoint || window?.blocklet?.prefix || '/';

export const setPrefixPath = (apiPathProps: any) => {
  if (apiPathProps.disableMediaKitPrefix) {
    // @ts-ignore
    prefixPath = window?.blocklet?.prefix || '/';
    return;
  }
  prefixPath = mediaKitMountPoint || '/';
};

export const api = createAxios({
  timeout: 200000,
});

api.interceptors.request.use(
  (config) => {
    config.baseURL = prefixPath || '/';
    config.timeout = 200000;
    return config;
  },
  (error) => Promise.reject(error)
);

export const mediaKitApi = createAxios({
  timeout: 200000,
});

mediaKitApi.interceptors.request.use(
  (config) => {
    config.baseURL = mediaKitMountPoint || '/';

    // @ts-ignore
    const folderId = window?.uploaderComponentId || (window?.blocklet?.componentId || '').split('/').pop();
    config.headers['x-component-did'] = folderId;

    return config;
  },
  (error) => Promise.reject(error)
);

export function getUploaderEndpoint(apiPathProps: any) {
  const uploaderUrl = joinUrl(
    window.location.origin,
    prefixPath === '/' || apiPathProps.disableAutoPrefix ? '' : prefixPath,
    apiPathProps.uploader || ''
  );

  // however, companionUrl must use mediaKitMountPoint
  const companionUrl = joinUrl(
    window.location.origin,
    mediaKitMountPoint === '/' || apiPathProps.disableAutoPrefix ? '' : mediaKitMountPoint,
    apiPathProps.companion || ''
  );

  return {
    uploaderUrl,
    companionUrl,
  };
}

export function getUrl(...args: string[]) {
  const realArgs = args.filter(Boolean).map((item) => {
    if (item === '/') {
      return '';
    }
    return item;
  });
  return joinUrl(...realArgs);
}

export function createImageUrl(filename: string, width = 0, height = 0, overwritePrefixPath: string = '') {
  // @ts-ignore
  const { CDN_HOST = '' } = window?.blocklet || {};
  const obj = new URL(CDN_HOST || window.location.origin);
  let prefix = prefixPath === '/' ? '' : prefixPath;

  if (overwritePrefixPath) {
    prefix = overwritePrefixPath;
  }

  obj.pathname = joinUrl(prefix, '/uploads/', filename);

  const extension = filename.split('.').pop() || '';
  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
    if (width) {
      obj.searchParams.set('imageFilter', 'resize');
      obj.searchParams.set('w', width.toString());
    }
    if (height) {
      obj.searchParams.set('imageFilter', 'resize');
      obj.searchParams.set('h', height.toString());
    }
  }

  return obj.href;
}

export const UPLOADER_UPLOAD_SUCCESS = 'uploader-upload-success';
export const OPEN = 'uploader-open';
export const CLOSE = 'uploader-close';

export function initUppy(currentUppy: any) {
  currentUppy.getUploadSuccessKey = (file: any) => {
    if (file?.id) {
      return `${UPLOADER_UPLOAD_SUCCESS}:${file.id}`;
    }
    return UPLOADER_UPLOAD_SUCCESS;
  };

  currentUppy.offUploadSuccess = (file: any) => {
    currentUppy.off(currentUppy.getUploadSuccessKey(file));
  };

  currentUppy.uploadSuccessHandler = (file: any, callback: Function, useOnce: boolean) => {
    if (typeof file === 'function') {
      callback = file;
      file = {};
    }

    const eventKey = currentUppy.getUploadSuccessKey(file);

    currentUppy.offUploadSuccess(file);

    if (useOnce) {
      currentUppy.once(eventKey, (file: any, response: any) => {
        callback({ file, response });
      });
    } else {
      currentUppy.on(eventKey, (file: any, response: any) => {
        callback({ file, response });
      });
    }
  };

  currentUppy.onceUploadSuccess = (file: any, callback: Function) => {
    currentUppy.uploadSuccessHandler(file, callback, true);
  };

  currentUppy.onUploadSuccess = (file: any, callback: Function) => {
    currentUppy.uploadSuccessHandler(file, callback, false);
  };

  currentUppy.emitUploadSuccess = (file: any, response: any) => {
    const eventKey = currentUppy.getUploadSuccessKey(file);
    currentUppy.emit(eventKey, file, response);
  };

  // ignore duplicate add files at the same time
  const originalAddFiles = debounce(currentUppy.addFiles, 50);

  currentUppy.addFiles = (files: any[]) => {
    originalAddFiles.call(currentUppy, files);
  };

  // upload file
  currentUppy.uploadFile = async (blobFile: Blob) => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      const { name, type } = blobFile;

      const uppyFileId = currentUppy.addFile({
        // ignore duplicate file
        name: `${new Date().valueOf()}-${name}`,
        type,
        data: blobFile, // file blob
        source: 'function-upload-file',
        isRemote: false,
      });

      const uppyFile = currentUppy.getFile(uppyFileId);

      // listen uploader upload success
      currentUppy.onceUploadSuccess(uppyFile, (result: any) => {
        currentUppy.removeFiles([uppyFileId]);
        resolve(result);
      });

      currentUppy.once('error', (error: any) => {
        // @ts-ignore always remove old listener
        currentUppy.offUploadSuccess(uppyFile);
        // remove it
        currentUppy.removeFiles([uppyFileId]);
        reject(error);
      });

      currentUppy.upload();
    });
  };

  // rewrite removeFiles
  currentUppy.removeFiles = (fileIDs: string[]) => {
    const { files, currentUploads } = currentUppy.getState();
    const updatedFiles = { ...files };
    const updatedUploads = { ...currentUploads };

    const removedFiles = Object.create(null);
    fileIDs.forEach((fileID: string) => {
      if (files[fileID]) {
        removedFiles[fileID] = files[fileID];
        delete updatedFiles[fileID];
      }
    });

    // Remove files from the `fileIDs` list in each upload.
    function fileIsNotRemoved(uploadFileID: string) {
      return removedFiles[uploadFileID] === undefined;
    }

    Object.keys(updatedUploads).forEach((uploadID) => {
      const newFileIDs = currentUploads[uploadID].fileIDs.filter(fileIsNotRemoved);

      // Remove the upload if no files are associated with it anymore.
      if (newFileIDs.length === 0) {
        delete updatedUploads[uploadID];
        return;
      }

      const { capabilities } = currentUppy.getState();
      if (newFileIDs.length !== currentUploads[uploadID].fileIDs.length && !capabilities.individualCancellation) {
        throw new Error('individualCancellation is disabled');
      }

      updatedUploads[uploadID] = {
        ...currentUploads[uploadID],
        fileIDs: newFileIDs,
      };
    });

    const stateUpdate = {
      currentUploads: updatedUploads,
      files: updatedFiles,
    };

    // If all files were removed - allow new uploads,
    // and clear recoveredState
    if (Object.keys(updatedFiles).length === 0) {
      // @ts-ignore
      stateUpdate.allowNewUpload = true;
      // @ts-ignore
      stateUpdate.error = null;
      // @ts-ignore
      stateUpdate.recoveredState = null;
    }

    currentUppy.setState(stateUpdate);
    currentUppy.calculateTotalProgress();

    const removedFileIDs = Object.keys(removedFiles);
    // not emit original file-removed, set a new event, because will delete remote files
    removedFileIDs.forEach((fileID) => {
      // currentUppy.emit('file-removed', removedFiles[fileID]);
      currentUppy.emit('file-removed-success', removedFiles[fileID]);
    });

    if (removedFileIDs.length > 5) {
      currentUppy.log(`Removed ${removedFileIDs.length} files`);
    } else {
      currentUppy.log(`Removed files: ${removedFileIDs.join(', ')}`);
    }
  };

  currentUppy.emitOpen = (...args: any[]) => {
    currentUppy.emit(OPEN, ...args);
  };

  currentUppy.onOpen = (callback: Function) => {
    currentUppy.off(OPEN);
    currentUppy.once(OPEN, callback);
  };

  currentUppy.emitClose = (...args: any[]) => {
    currentUppy.emit(CLOSE, ...args);
  };

  currentUppy.onClose = (callback: Function) => {
    currentUppy.off(CLOSE);
    currentUppy.once(CLOSE, callback);
  };

  currentUppy.calculateTotalProgress = () => {
    // calculate total progress, using the number of files currently uploading,
    // multiplied by 100 and the summ of individual progress of each file
    const files = currentUppy.getFiles();

    const inProgress = files.filter((file: any) => {
      return file.progress.uploadStarted || file.progress.preprocess || file.progress.postprocess;
    });

    if (inProgress.length === 0) {
      currentUppy.emit('progress', 0);
      currentUppy.setState({ totalProgress: 0 });
      return;
    }

    const sizedFiles = inProgress.filter((file: any) => file.progress.bytesTotal != null);
    const unsizedFiles = inProgress.filter((file: any) => file.progress.bytesTotal == null);

    if (sizedFiles.length === 0) {
      const progressMax = inProgress.length * 100;
      const currentProgress = unsizedFiles.reduce((acc: number, file: any) => {
        return acc + file.progress.percentage;
      }, 0);
      const totalProgress = Math.round((currentProgress / progressMax) * 100);
      currentUppy.setState({ totalProgress });
      return;
    }

    let totalSize = sizedFiles.reduce((acc: number, file: any) => {
      return acc + file.progress.bytesTotal;
    }, 0);
    const averageSize = totalSize / sizedFiles.length;
    totalSize += averageSize * unsizedFiles.length;

    let uploadedSize = 0;
    sizedFiles.forEach((file: any) => {
      uploadedSize += file.progress.bytesUploaded;
    });
    unsizedFiles.forEach((file: any) => {
      uploadedSize += (averageSize * (file.progress.percentage || 0)) / 100;
    });

    const uploadCompleteFiles = files.filter((file: any) => file.progress.uploadComplete);
    const isUploadComplete = uploadCompleteFiles.length === files.length;

    // hot fix, because:
    // upload size: 0 file should be 100%
    let totalProgress = totalSize === 0 ? (isUploadComplete ? 100 : 0) : Math.round((uploadedSize / totalSize) * 100);

    // hot fix, because:
    // uploadedSize ended up larger than totalSize, resulting in 1325% total
    if (totalProgress > 100) {
      totalProgress = 100;
    }

    currentUppy.setState({ totalProgress });
    currentUppy.emit('progress', totalProgress);
  };

  // rewrite upload method
  const originalUpload = currentUppy.upload.bind(currentUppy);

  currentUppy.upload = async () => {
    const files = currentUppy.getFiles();

    files.forEach((file: { id: any }) => {
      currentUppy.setFileState(file.id, {
        progress: { uploadComplete: false, uploadStarted: false },
        error: null,
      });
    });

    return await originalUpload();
  };

  return currentUppy;
}

export function parseStringToDot(str: any) {
  if (typeof str !== 'string') return '';
  return str && str.length > 12 ? str.substring(0, 7) + '...' + str.substring(str.length - 5) : str;
}

export const isSvgFile = async (file: any) => {
  // Check MIME type
  if (file.type?.toLowerCase().includes('svg')) return true;

  // Check file extension
  if (file.name?.toLowerCase().endsWith('.svg')) return true;

  // Check file content
  try {
    const chunkSize = 1024 * 512; // 512 KB
    // Only read chunkSize bytes to check SVG signature
    const blob = file.data?.slice(0, chunkSize);
    if (!blob) return false;

    const content = await blob.text();
    if (!content) return false;

    // Check for SVG signature in content
    const svgRegex = /<svg[^>]*?(?:>|\/>)|<\?xml[^>]*>\s*<svg[^>]*?(?:>|\/?>)/i;
    return svgRegex.test(content);
  } catch (e) {
    return false;
  }
};

export const mockUploaderFileResponse = (file: any) => {
  if (!file) return null;

  try {
    // ensure the file is valid
    const safeFile = {
      fileUrl: file.fileUrl || file.icon || '',
      mimetype: file.mimetype || mime.lookup(file.fileUrl),
      originalname: file.originalname || file.name || 'unknown',
      filename: file.filename || file._id || `${Date.now()}.unknown`,
      size: file.size || 0,
      remark: file.remark || '',
      tags: Array.isArray(file.tags) ? file.tags : [],
      folderId: file.folderId || '',
      createdAt: file.createdAt || new Date().toISOString(),
      updatedAt: file.updatedAt || new Date().toISOString(),
      createdBy: file.createdBy || '',
      updatedBy: file.updatedBy || '',
      _id: file._id || file.id || `${Date.now()}`,
      previewUrl: file.previewUrl || file.icon || file.fileUrl || '',
    };

    // ensure the baseUrl is valid
    let baseUrl = '';
    try {
      baseUrl = new URL(safeFile.fileUrl).origin;
    } catch (e) {
      baseUrl = window.location.origin;
    }

    const fileId = `Uploader-${safeFile.originalname.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;

    const data = {
      url: safeFile.fileUrl,
      mimetype: safeFile.mimetype,
      originalname: safeFile.originalname,
      filename: safeFile.filename,
      size: safeFile.size,
      remark: safeFile.remark,
      tags: safeFile.tags,
      folderId: safeFile.folderId,
      createdAt: safeFile.createdAt,
      updatedAt: safeFile.updatedAt,
      createdBy: safeFile.createdBy,
      updatedBy: safeFile.updatedBy,
      _id: safeFile._id,
    };

    return {
      data,
      method: 'POST',
      url: baseUrl + '/image-bin/api/uploads',
      status: 200,
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(safeFile.size),
        'x-uploader-file-name': safeFile.filename,
        'x-uploader-file-id': fileId,
        'x-uploader-file-ext': safeFile.filename.split('.').pop() || 'unknown',
        'x-uploader-base-url': '/image-bin/api/uploads',
        'x-uploader-endpoint-url': baseUrl + '/image-bin/api/uploads',
        'x-uploader-metadata': JSON.stringify({
          uploaderId: 'Uploader',
          relativePath: safeFile.originalname,
          name: safeFile.originalname,
          type: safeFile.mimetype,
        }),
        'x-component-did': safeFile.folderId,
        'x-uploader-file-exist': 'true',
      },
      file: {
        source: 'uploader-dashboard',
        id: fileId,
        name: safeFile.originalname,
        extension: safeFile.filename.split('.').pop() || 'unknown',
        meta: {
          uploaderId: 'Uploader',
          relativePath: safeFile.originalname,
          name: safeFile.originalname,
          type: safeFile.mimetype,
        },
        type: safeFile.mimetype,
        data,
        progress: {
          uploadStarted: Date.now(),
          uploadComplete: false,
          percentage: 0,
          bytesUploaded: 0,
          bytesTotal: safeFile.size,
        },
        size: safeFile.size,
        isGhost: false,
        isRemote: false,
        remote: '',
        preview: safeFile.previewUrl,
        hashFileName: safeFile.filename,
        error: null,
        uploadID: Math.random().toString(36).substring(2, 15),
      },
      uploadURL: safeFile.fileUrl,
    };
  } catch (error) {
    console.error('Error in mockResponse:', error);
    return null;
  }
};
