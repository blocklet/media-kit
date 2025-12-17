// @jsxImportSource preact
import { UIPlugin } from '@uppy/core';
import DOMPurify from 'dompurify';
import { getObjectURL, getExt, blobToFile, getDownloadUrl, isSvgFile } from '../../utils';
import { unzipSync, decompressSync } from 'fflate';
import mime from 'mime-types';
import SparkMD5 from 'spark-md5';
import { rotation } from 'exifr';

const zipBombMap = {
  zip: unzipSync,
  gz: decompressSync,
  tgz: decompressSync,
  deflate: decompressSync,
};

class PrepareUpload extends UIPlugin {
  constructor(uppy, opts) {
    const defaultOptions = {};
    super(uppy, { ...defaultOptions, ...opts });

    this.id = this.opts.id || 'PrepareUpload';
    this.type = 'progressindicator';

    this.i18nInit();
  }

  setHashFileName = async (uppyFile) => {
    const { id } = uppyFile;
    const file = this.uppy.getFile(id);

    if (file) {
      const { data } = file;
      const chunkSize = 1024 * 1024 * 5; // 5 MB
      const blobSlice = data.slice(0, chunkSize);

      // Get text content from blob
      const text = await blobSlice.text();
      // Get MD5 hash using SparkMD5
      const spark = new SparkMD5();
      spark.append(text);
      const hash = spark.end();

      const ext = getExt(file);
      const hashFileName = `${hash}${ext ? `.${ext}` : ''}`;

      this.uppy.setFileState(id, {
        hashFileName,
      });
    }
  };

  setMetaData = async (uppyFile) => {
    const { id } = uppyFile;

    const file = this.uppy.getFile(id); // get real time file

    if (file) {
      const {
        data: { webkitRelativePath, relativePath, name },
        hashFileName,
        size,
      } = file;

      const relativePathWithFileName = relativePath || webkitRelativePath || name || hashFileName;
      // relativePath must had file name
      this.uppy.setFileMeta(id, {
        relativePath: relativePathWithFileName,
        name: relativePathWithFileName,
      });
    }
  };

  // prevent xss attack
  preventXssAttack = async (uppyFile) => {
    const { id } = uppyFile;
    const file = this.uppy.getFile(id); // get real time file

    if (file) {
      // get real time file
      const { name, meta } = this.uppy.getFile(id);
      // clean file name xss attack
      const cleanName = DOMPurify.sanitize(name);

      if (name !== cleanName) {
        const ext = getExt(file);
        const newFileName = cleanName.endsWith(`.${ext}`) ? cleanName : `${cleanName}.${ext}`;

        this.uppy.setFileState(id, {
          name: newFileName,
          meta: {
            ...meta,
            name: newFileName,
            filename: newFileName,
          },
        });
      }

      // type is image/svg or file content with <svg tag
      const isSvg = await isSvgFile(file);

      // clean svg file xss attack
      if (isSvg) {
        // get real time file
        const { data, name, type } = this.uppy.getFile(id);
        const fileText = await data.text();
        // Collect all valid IDs in the SVG for internal references
        const validIds = new Set();
        const tempDoc = new DOMParser().parseFromString(fileText, 'image/svg+xml');
        const allElements = tempDoc.querySelectorAll('[id]');
        allElements.forEach((el) => validIds.add(el.id));

        // Add hooks to handle SVG use elements and xlink:href
        DOMPurify.addHook('uponSanitizeElement', (node, data) => {
          // Force keep <use> elements that reference internal IDs
          if (data.tagName === 'use') {
            const href = node.getAttribute('xlink:href') || node.getAttribute('href');
            if (href && href.startsWith('#')) {
              const targetId = href.substring(1);
              if (validIds.has(targetId)) {
                data.allowedTags.use = true;
                data.forceKeepNode = true;
              }
            }
          }
        });

        DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
          // Handle xlink:href for internal references
          if (data.attrName === 'xlink:href' && data.attrValue) {
            if (data.attrValue.startsWith('#')) {
              const targetId = data.attrValue.substring(1);
              if (validIds.has(targetId)) {
                data.forceKeepAttr = true;
                return;
              }
            }
            data.keepAttr = false;
          }

          // Allow percentage values and overflow style
          if (['width', 'height'].includes(data.attrName) && data.attrValue === '100%') {
            data.forceKeepAttr = true;
          }

          if (data.attrName === 'style' && data.attrValue === 'overflow:visible') {
            data.forceKeepAttr = true;
          }
        });

        const cleanFile = DOMPurify.sanitize(fileText, {
          USE_PROFILES: { svg: true, svgFilters: true },
          ALLOWED_TAGS: [
            'svg',
            'circle',
            'ellipse',
            'line',
            'path',
            'polygon',
            'polyline',
            'rect',
            'g',
            'text',
            'use',
            'defs',
            'clipPath',
            'mask',
            'pattern',
            'linearGradient',
            'radialGradient',
            'stop',
          ],
          ALLOWED_ATTR: [
            'd',
            'points',
            'x',
            'y',
            'width',
            'height',
            'r',
            'cx',
            'cy',
            'rx',
            'ry',
            'x1',
            'y1',
            'x2',
            'y2',
            'transform',
            'fill',
            'stroke',
            'stroke-width',
            'viewBox',
            'xmlns',
            'xmlns:xlink',
            'xml:space',
            'style',
            'id',
            'class',
            'offset',
            'stop-color',
            'stop-opacity',
            'clip-path',
            'mask',
            'fill-opacity',
            'stroke-opacity',
            'gradientTransform',
            'gradientUnits',
            'xlink:href', // Allow it in attributes but control via hook
          ],
          FORBID_TAGS: ['a', 'script', 'iframe', 'image', 'foreignObject'],
          FORBID_ATTR: ['href', 'onclick', 'onload', 'onerror'],
        });

        // Clean up the hooks after use
        DOMPurify.removeHook('uponSanitizeElement');
        DOMPurify.removeHook('uponSanitizeAttribute');
        if (fileText !== cleanFile) {
          // rewrite clean file
          const blob = new Blob([cleanFile], { type: type });
          const blobFile = blobToFile(blob, name);
          this.uppy.setFileState(id, {
            ...this.uppy.getFile(id),
            data: blobFile,
            preview: getObjectURL(blobFile),
          });
          console.info('clean svg file xss attack', { name, originalFile: file.data.text(), cleanFile });
        }
      }
    }
  };

  // prevent zip bomb attack
  preventZipBombAttack = async (uppyFile) => {
    const { id } = uppyFile;
    const file = this.uppy.getFile(id); // get real time file

    try {
      if (file && zipBombMap[file.extension]) {
        const { data } = file;

        // object {filename: Uint8Array} or Uint8Array
        const unzippedMap = zipBombMap[file.extension](new Uint8Array(await data.arrayBuffer()));

        const getTotalUnzippedSize = (_unzippedMap, _name, depth = 0) => {
          return Object.entries(
            _unzippedMap instanceof Uint8Array
              ? {
                  [_name || file.name]: _unzippedMap,
                }
              : _unzippedMap
          ).reduce((acc, [name, item]) => {
            // Add null check and size check for item
            if (!item || item.byteLength === 0) {
              console.warn('Invalid or empty item in unzipped content', { name, item });
              return acc;
            }

            const baseAcc = acc + item.byteLength;

            if (depth >= 5 || baseAcc > file.size * 100) {
              console.error('Zip bomb detected, please check your file', {
                depth,
                baseAcc,
                fileSize: file.size,
              });
              throw new Error('Zip bomb detected, please check your file');
            }

            const ext = mime.extension(mime.lookup(name));

            if (zipBombMap[ext]) {
              const childUnzippedMap = zipBombMap[ext](item);

              // Pass current depth + 1 to recursive call
              return baseAcc + getTotalUnzippedSize(childUnzippedMap, name, depth + 1);
            }

            return baseAcc;
          }, 0);
        };

        const totalUnzippedSize = getTotalUnzippedSize(unzippedMap);

        // if totalUnzippedSize > file.size * 100, throw error
        if (totalUnzippedSize > file.size * 100) {
          throw new Error('Zip bomb detected, please check your file');
        }
      }
    } catch (error) {
      // if Zip bomb attack, delete file
      if (error.message.includes('Zip bomb detected')) {
        throw error;
      }
      // if other error, ignore
    }
  };

  // validate image respect cropper options
  validateImagesRespectCropperOptions = async () => {
    return this.uppy.getFiles().reduce(async (promise, uppyFile) => {
      await promise; // Wait for previous validation
      const { id } = uppyFile;
      let file = this.uppy.getFile(id);

      if (file.isRemote) {
        // remote file should be downloaded
        await this.tryDownloadRemoteFile(file);
        file = this.uppy.getFile(id);
      }

      if (
        !this.opts.cropperOptions?.aspectRatio ||
        !file?.type?.includes('image') ||
        file.type?.includes('image/svg')
      ) {
        return Promise.resolve();
      }

      const { aspectRatio: _aspectRatio } = this.opts.cropperOptions;
      const ImageEditor = this.uppy.getPlugin('ImageEditor');

      // get image element to calculate aspect ratio
      const imageElement =
        document.querySelector(`[src="${file.preview}"]`) || document.getElementById('uppy_' + id).querySelector('img');

      const width = imageElement?.naturalWidth;
      const height = imageElement?.naturalHeight;

      const imageAspectRatio = Number(width / height).toFixed(2);
      const aspectRatio = Number(_aspectRatio).toFixed(2);

      if (imageAspectRatio === aspectRatio) {
        return Promise.resolve();
      }

      this.uppy.emit('preprocess-progress', file, {
        mode: 'indeterminate',
        message: this.i18n('editorLoading'),
      });

      const Dashboard = ImageEditor.parent;
      Dashboard.openFileEditor(file);

      const tip = this.i18n('aspectRatioMessage', {
        imageAspectRatio,
        aspectRatio,
      });

      // send tip to user
      this.uppy.info({
        message: tip,
        details: tip,
      });

      // Return a promise that resolves when the editor is complete
      return new Promise((resolve, reject) => {
        this.uppy.once('file-editor:complete', () => {
          // wait for editor complete
          setTimeout(() => {
            resolve();
          }, 200);
        });

        this.uppy.once('file-editor:cancel', () => {});
      });
    }, Promise.resolve());
  };

  checkImageOrientation = async (uppyFile) => {
    const { id } = uppyFile;
    const file = this.uppy.getFile(id);

    if (!file?.type?.startsWith('image/')) return;

    try {
      const transform = await rotation(file.data).catch(() => ({
        deg: 0,
      }));

      if (!transform.deg) return;

      const targetSize = file.data.size * 0.98; // reduce file size by 98%

      // image load with auto rotate
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        let objectUrl = URL.createObjectURL(file.data);
        img.src = objectUrl;
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
          resolve(img);
        };
        img.onerror = (error) => {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }
          reject(new Error(`Image load failed: ${error.message}`));
        };
      });

      const aspectRatio = image.width / image.height;
      let newWidth = Math.sqrt(targetSize * aspectRatio);
      let newHeight = newWidth / aspectRatio;

      const MAX_DIMENSION = 8096;
      if (newWidth > MAX_DIMENSION || newHeight > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(newWidth, newHeight);
        newWidth *= scale;
        newHeight *= scale;
      }

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d', {
        willReadFrequently: true,
        alpha: file.type === 'image/png',
      });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.drawImage(image, -newWidth / 2, -newHeight / 2, newWidth, newHeight);

      const quality = 1;

      const newImage = await new Promise((resolve) => {
        canvas.toBlob(resolve, file.type, quality);
      });

      this.uppy.setFileState(id, {
        data: newImage,
        size: newImage.size,
      });
    } catch (error) {
      console.error('Image rotation processing failed:', error);
      return;
    }
  };

  prepareUploadWrapper = async (uppyFile) => {
    await this.tryDownloadRemoteFile(uppyFile);
    await this.checkImageOrientation(uppyFile);
    await this.getPreviewFromData(uppyFile);
    await this.setHashFileName(uppyFile);
    if (!this.opts.disableXssAttack) {
      await this.preventXssAttack(uppyFile);
    }
    await this.preventZipBombAttack(uppyFile);
    await this.setMetaData(uppyFile);
  };

  tryDownloadRemoteFile = async (uppyFile) => {
    const {
      type,
      name,
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

    // name maybe include query string, remove it
    const nameWithoutQuery = name?.split('?')?.[0];

    const notAddExt = () => {
      const extList = ['jpg', 'jpeg'];
      if (extList.includes(ext) && extList.some((item) => nameWithoutQuery?.endsWith(item))) {
        return true;
      }
      return nameWithoutQuery?.endsWith(ext);
    };

    const fileName = notAddExt() ? nameWithoutQuery : `${nameWithoutQuery}${ext ? `.${ext}` : ''}`;

    // not downloading
    if (notDownloading) {
      const url = getDownloadUrl(preview || remote?.body?.url);
      // retry 3 times
      if (errorCount >= 3) {
        // set file error
        this.uppy.setFileState(id, {
          error: this.i18n('downloadRemoteFileFailure'),
          meta: {
            ...meta,
            name: this.i18n('downloadRemoteFileFailure'),
          },
        });

        throw new Error('Download remote file failure');
      }

      this.uppy.setFileState(id, {
        isLoading: true,
        isDownloading: true,
        size: null,
        meta: {
          ...meta,
          name: this.i18n('loading'),
        },
      });

      await fetch(url)
        .then(async (response) => {
          const blob = await response.blob();
          return blob;
        })
        .then(async (blob) => {
          const blobFile = blobToFile(blob, fileName);

          this.uppy.setFileState(id, {
            name: fileName, // file name
            extension: ext, // file extension
            type, // file type
            data: blobFile, // file blob
            preview: !preview ? getObjectURL(blobFile) : preview, // file blob
            source, // optional, determines the source of the file, for example, Instagram.
            size: blobFile.size,
            isDownloading: false,
            isRemote: false,
            meta: {
              ...meta,
              name: fileName,
              filename: fileName,
            },
          });

          const uppyFile = this.uppy.getFile(id);

          // emit downloaded event
          this.uppy.emit(emitKey, id);
        })
        .catch(async (error) => {
          console.error('Axios download remote file error: ', error);

          if (type.startsWith('image/')) {
            const newType = type.includes('svg') ? 'image/png' : type;
            const newFileName = fileName.endsWith('.svg') ? fileName.replace('.svg', '.png') : fileName;
            try {
              const blob = await new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  canvas.width = img.width;
                  canvas.height = img.height;
                  const ctx = canvas.getContext('2d');

                  // Center the image on canvas
                  ctx.translate(canvas.width / 2, canvas.height / 2);
                  ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

                  canvas.toBlob(resolve, newType);
                };
                img.onerror = reject;
                img.src = url;
              });

              let blobFile = blobToFile(blob, newFileName);

              this.uppy.setFileState(id, {
                name: newFileName, // file name
                extension: ext, // file extension
                type: newType, // file type
                data: blobFile, // file blob
                preview: !preview ? getObjectURL(blobFile) : preview, // file blob
                source, // optional, determines the source of the file, for example, Instagram.
                size: blobFile.size,
                isDownloading: false,
                isRemote: false,
                meta: {
                  ...meta,
                  name: newFileName,
                  filename: newFileName,
                },
              });

              const uppyFile = this.uppy.getFile(id);

              // emit downloaded event
              this.uppy.emit(emitKey, id);

              return;
            } catch (error) {
              // ignore error
            }
          }

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

  prepareUpload = async (fileIDs) => {
    // validate all images aspect ratio
    await this.validateImagesRespectCropperOptions();

    const promises = fileIDs.map(async (id) => {
      const file = this.uppy.getFile(id);
      // had some file downloading
      if (file.isDownloading) {
        this.uppy.emit('preprocess-progress', file, {
          mode: 'indeterminate',
          message: this.i18n('loading'),
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
    // Because it leads to StatusBar showing a weird "upload 6 files" button,
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

  render() {
    return <></>;
  }
}

export default PrepareUpload;
