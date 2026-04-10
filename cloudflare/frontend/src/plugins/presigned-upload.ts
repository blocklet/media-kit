/**
 * Direct Upload Plugin for Uppy
 *
 * Uploads files through the Worker (POST /uploads/direct with FormData).
 * Works in both local dev (miniflare) and production.
 * For production with large files, can be extended to use presigned URLs.
 */

import { BasePlugin } from '@uppy/core';

interface DirectUploadOptions {
  id?: string;
  apiBase: string;
  headers?: Record<string, string>;
}

export default class DirectUploadPlugin extends BasePlugin {
  declare opts: DirectUploadOptions;
  private boundHandleUpload: (fileIDs: string[]) => Promise<void>;

  constructor(uppy: any, opts: DirectUploadOptions) {
    super(uppy, opts);
    this.id = opts.id || 'DirectUpload';
    this.type = 'uploader';
    this.opts = opts;
    this.boundHandleUpload = this.handleUpload.bind(this);
  }

  install() {
    this.uppy.addUploader(this.boundHandleUpload);
  }

  uninstall() {
    this.uppy.removeUploader(this.boundHandleUpload);
  }

  private async handleUpload(fileIDs: string[]): Promise<void> {
    const files = fileIDs.map((id) => this.uppy.getFile(id));
    for (const file of files) {
      try {
        await this.uploadFile(file);
      } catch (err: any) {
        this.uppy.log(`[DirectUpload] Error: ${err.message}`, 'error');
        this.uppy.emit('upload-error', file, err);
      }
    }
  }

  private async uploadFile(file: any): Promise<void> {
    const formData = new FormData();
    formData.append('file', file.data, file.name);
    if (file.meta?.folderId) {
      formData.append('folderId', file.meta.folderId);
    }
    if (file.meta?.tags) {
      formData.append('tags', file.meta.tags);
    }

    const xhr = new XMLHttpRequest();
    const result = await new Promise<any>((resolve, reject) => {
      xhr.open('POST', `${this.opts.apiBase}/uploads/direct`, true);

      // Set custom headers (auth is handled via login_token cookie)
      xhr.withCredentials = true;
      const headers = this.opts.headers || {};
      Object.entries(headers).forEach(([k, v]) => {
        if (k.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(k, v);
        }
      });

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          this.uppy.setFileState(file.id, {
            progress: {
              uploadStarted: Date.now(),
              uploadComplete: false,
              percentage: Math.round((e.loaded / e.total) * 100),
              bytesUploaded: e.loaded,
              bytesTotal: e.total,
            },
          });
          this.uppy.emit('upload-progress', this.uppy.getFile(file.id), {
            uploader: this,
            bytesUploaded: e.loaded,
            bytesTotal: e.total,
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          let errMsg = `Upload failed: ${xhr.status}`;
          try {
            errMsg = JSON.parse(xhr.responseText).error || errMsg;
          } catch {}
          reject(new Error(errMsg));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload aborted'));

      xhr.send(formData);
    });

    const uploadURL = result.url || `/uploads/${result.filename}`;

    this.uppy.setFileState(file.id, {
      progress: {
        uploadStarted: Date.now(),
        uploadComplete: true,
        percentage: 100,
        bytesUploaded: file.size || file.data?.size || 0,
        bytesTotal: file.size || file.data?.size || 0,
      },
    });

    this.uppy.emit('upload-success', this.uppy.getFile(file.id), {
      uploadURL,
      status: 200,
      body: result,
    });
  }
}
