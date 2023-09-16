// @jsxImportSource preact
import { UIPlugin } from '@uppy/core';
import crypto from 'crypto';
import { getObjectURL, getExt, blobToFile, getDownloadUrl, api } from '../../utils';

class DownloadRemoteFiles extends UIPlugin {
  constructor(uppy, opts) {
    const defaultOptions = {};
    super(uppy, { ...defaultOptions, ...opts });

    this.id = this.opts.id || 'DownloadRemoteFiles';
    this.type = 'modifier';

    this.defaultLocale = {
      strings: {
        downloadingFiles: 'Downloading remote files...',
      },
    };

    this.i18nInit();
  }

  setHashFileName = async (uppyFile) => {
    const { id } = uppyFile;

    const file = this.uppy.getFile(id); // get real time file

    if (file) {
      const { data } = file;

      const chunkSize = 1024 * 1024 * 5; // 5 MB
      const blobSlice = data.slice(0, chunkSize); // use slice to get hash

      // read file contents, get it MD5 hash
      const hash = crypto
        .createHash('md5')
        .update(await blobSlice.text())
        .digest('hex');

      const ext = getExt(file);

      const hashFileName = `${hash}${ext ? `.${ext}` : ''}`;

      this.uppy.setFileState(id, {
        hashFileName,
      });
    }
  };

  prepareUploadWrapper = async (uppyFile) => {
    await this.tryDownloadRemoteFile(uppyFile);
    await this.getPreviewFromData(uppyFile);
    await this.setHashFileName(uppyFile);
  };

  tryDownloadRemoteFile = async (uppyFile) => {
    const {
      type,
      name,
      extension,
      preview,
      source,
      isRemote,
      isDownloading,
      id,
      isLoading,
      remote,
      meta,
      errorCount = 0,
    } = uppyFile;

    const notDownloading = !isLoading && isRemote;

    const emitKey = `uploader:${id}:downloaded`;

    const ext = getExt(uppyFile);

    const fileName = extension ? name : `${name}${ext ? `.${ext}` : ''}`;

    // not downloading
    if (notDownloading) {
      const url = getDownloadUrl(preview || remote?.body?.url);
      // retry 3 times
      if (errorCount >= 3) {
        throw new Error('Download remote file failure');
      }
      this.uppy.setFileState(id, {
        isLoading: true,
        isRemote: false,
        isDownloading: true,
        size: null,
        meta: {
          ...meta,
          name: 'Loading...',
        },
      });

      // get image from proxy url
      await api
        .get(`${this.opts.companionUrl}/proxy`, {
          responseType: 'blob',
          params: {
            url,
            // responseType: 'stream',
          },
        })
        .then((response) => {
          return response?.data;
        })
        .then(async (blob) => {
          const blobFile = blobToFile(blob, fileName);

          this.uppy.setFileState(id, {
            name: fileName, // file name
            type, // file type
            data: blobFile, // file blob
            preview: !preview ? getObjectURL(blobFile) : preview, // file blob
            source, // optional, determines the source of the file, for example, Instagram.
            size: blobFile.size,
            isDownloading: false,
            meta: {
              ...meta,
              name: fileName,
            },
          });

          // emit downloaded event
          this.uppy.emit(emitKey, id);
        })
        .catch(async (error) => {
          console.error('Axios download remote file error: ', error);

          this.uppy.setFileState(id, {
            isRemote: true,
            isLoading: false,
            errorCount: errorCount + 1,
          });

          // retry
          await this.tryDownloadRemoteFile(this.uppy.getFile(id));
        });
    } else if (isDownloading) {
      // wait for event
      const waitForDownload = async () => {
        return new Promise((resolve) => {
          this.uppy.once(emitKey, async () => {
            resolve();
          });
        });
      };

      await waitForDownload();
    }
  };

  getPreviewFromData = (uppyFile) => {
    const { id } = uppyFile;

    const file = this.uppy.getFile(id); // get real time file

    if (file) {
      const { data, type, preview } = file;

      const isGif = type.indexOf('gif') > -1;

      const shouldGetPreviewFromData = (isGif || !preview) && data && type.indexOf('image') > -1;
      if (shouldGetPreviewFromData) {
        setTimeout(
          () => {
            this.uppy.setFileState(id, {
              preview: getObjectURL(data),
            });
          },
          // fix gif preview error
          type.indexOf('gif') > -1 ? 1000 : 0
        );
      }
    }
  };

  prepareUpload = (fileIDs) => {
    const promises = fileIDs.map(async (id) => {
      const file = this.uppy.getFile(id);
      // had some file downloading
      if (file.isDownloading) {
        this.uppy.emit('preprocess-progress', file, {
          mode: 'indeterminate',
          message: this.i18n('downloadingFiles'),
        });
      }
      await this.prepareUploadWrapper(file);
    });

    const emitPreprocessCompleteForAll = () => {
      fileIDs.forEach((id) => {
        const file = this.uppy.getFile(id);
        this.uppy.emit('preprocess-complete', file);
      });
    };

    // Why emit `preprocess-complete` for all files at once, instead of
    // above when each is processed?
    // Because it leads to StatusBar showing a weird “upload 6 files” button,
    // while waiting for all the files to complete pre-processing.
    return Promise.all(promises).then(emitPreprocessCompleteForAll);
  };

  install() {
    this.uppy.addPreProcessor(this.prepareUpload);
    this.uppy.on('file-added', async (file) => {
      // wait for animation
      setTimeout(() => {
        this.prepareUploadWrapper(file);
      }, 200);
    });
    this.uppy.on('file-editor:complete', (file) => {
      this.getPreviewFromData(file);
    });
  }

  uninstall() {
    this.uppy.removePreProcessor(this.prepareUpload);
  }
}

export default DownloadRemoteFiles;
