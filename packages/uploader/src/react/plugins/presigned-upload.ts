/**
 * Presigned Upload Plugin for Uppy
 *
 * Implements presigned URL upload flow as an alternative to TUS protocol.
 * Used when the backend returns uploadMode: 'presigned' from /api/uploader/status.
 *
 * Flow:
 * 1. POST /uploads/check    → dedup check (size + ext)
 * 2. POST /uploads/presign  → get presigned URL or multipart session
 * 3. PUT  presignedUrl       → direct upload to R2/S3
 * 4. POST /uploads/confirm  → confirm and get upload record
 *
 * For large files (>= multipart threshold):
 * 2b. POST /uploads/presign → get multipart session
 * 3b. For each part:
 *     POST /uploads/multipart/part-url → get part presigned URL
 *     PUT  partUrl → upload part
 * 3c. POST /uploads/multipart/complete → assemble parts
 * 4.  POST /uploads/confirm → confirm
 */

import { BasePlugin } from '@uppy/core';
import Cookie from 'js-cookie';

// @ts-ignore - getExt is exported from utils
import { getExt } from '../../utils';

interface PresignedUploadOptions {
  id?: string;
  apiBase: string; // e.g. '/api' or full URL
  headers?: Record<string, string>;
}

export default class PresignedUploadPlugin extends BasePlugin {
  declare opts: PresignedUploadOptions;

  private boundHandleUpload: (fileIDs: string[]) => Promise<void>;

  constructor(uppy: any, opts: PresignedUploadOptions) {
    super(uppy, opts);
    this.id = opts.id || 'PresignedUpload';
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

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.opts.headers || {}),
    };
    const csrfToken = Cookie.get('x-csrf-token');
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
    // @ts-ignore
    const componentDid = window?.uploaderComponentId || window?.blocklet?.componentId;
    if (componentDid) {
      headers['x-component-did'] = (componentDid || '').split('/').pop() || '';
    }
    return headers;
  }

  private async apiCall(path: string, body: any): Promise<any> {
    const url = `${this.opts.apiBase}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || `Upload failed: ${res.status}`);
    }
    return res.json();
  }

  private async handleUpload(fileIDs: string[]): Promise<void> {
    const files = fileIDs.map((id) => this.uppy.getFile(id));

    for (const file of files) {
      try {
        await this.uploadFile(file);
      } catch (err: any) {
        this.uppy.log(`[PresignedUpload] Error uploading ${file.name}: ${err.message}`, 'error');
        this.uppy.emit('upload-error', file, err);
      }
    }
  }

  private async uploadFile(file: any): Promise<void> {
    const ext = getExt(file) || file.name.split('.').pop() || '';
    const size = file.size || file.data?.size || 0;
    const folderId = file.meta?.folderId || '';
    const tags = file.meta?.tags || '';

    // Step 1: Dedup check
    const checkResult = await this.apiCall('/uploads/check', { size, ext: `.${ext}` });

    let confirmData: any;

    if (checkResult.exists) {
      // File already exists — clone it via confirm
      confirmData = await this.apiCall('/uploads/confirm', {
        existingUploadId: checkResult.uploadId,
        originalname: file.name,
        mimetype: file.type,
        folderId,
        tags,
      });
    } else {
      // Step 2: Get presigned URL
      const presignResult = await this.apiCall('/uploads/presign', {
        originalname: file.name,
        mimetype: file.type,
        size,
        ext: `.${ext}`,
        folderId,
      });

      // Step 3: Upload file
      try {
        if (presignResult.multipart) {
          await this.uploadMultipart(file, presignResult);
        } else {
          await this.uploadDirect(file, presignResult.presignedUrl);
        }
      } catch (uploadErr) {
        // Abort multipart session on failure to avoid orphaned R2 parts
        if (presignResult.multipart) {
          await this.apiCall('/uploads/multipart/abort', { sessionId: presignResult.sessionId }).catch(() => {});
        }
        throw uploadErr;
      }

      // Step 4: Confirm
      confirmData = await this.apiCall('/uploads/confirm', {
        sessionId: presignResult.sessionId,
        originalname: file.name,
        mimetype: file.type,
        folderId,
        tags,
      });
    }

    // Build result compatible with TUS flow — use the url from server response directly
    let uploadURL = confirmData.url || `/uploads/${confirmData.filename}`;
    // Ensure absolute URL for cross-origin compatibility (CF Workers proxy)
    if (uploadURL.startsWith('/')) {
      uploadURL = `${this.opts.apiBase || window.location.origin}${uploadURL}`;
    }

    const result = {
      data: confirmData,
      method: 'POST',
      url: uploadURL,
      status: 200,
      headers: {} as Record<string, string>,
      file,
      uploadURL,
    };

    // Set file state
    this.uppy.setFileState(file.id, {
      progress: {
        uploadStarted: Date.now(),
        uploadComplete: true,
        percentage: 100,
        bytesUploaded: file.size || file.data?.size || 0,
        bytesTotal: file.size || file.data?.size || 0,
      },
      responseResult: result,
    });

    // Emit upload-success — the listener in uploader.tsx handles _onUploadFinish and emitUploadSuccess
    this.uppy.emit('upload-success', this.uppy.getFile(file.id), {
      uploadURL,
      status: 200,
      body: confirmData,
    });
  }

  private async uploadDirect(file: any, presignedUrl: string): Promise<void> {
    const xhr = new XMLHttpRequest();
    await new Promise<void>((resolve, reject) => {
      xhr.open('PUT', presignedUrl, true);
      if (file.type) {
        xhr.setRequestHeader('Content-Type', file.type);
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          this.uppy.setFileState(file.id, {
            progress: {
              uploadStarted: Date.now(),
              uploadComplete: false,
              percentage,
              bytesUploaded: e.loaded,
              bytesTotal: e.total,
            },
          });
          // @ts-ignore
          this.uppy.calculateTotalProgress?.();
          this.uppy.emit('upload-progress', this.uppy.getFile(file.id), {
            uploader: this,
            bytesUploaded: e.loaded,
            bytesTotal: e.total,
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Direct upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload aborted'));

      xhr.send(file.data);
    });
  }

  private async uploadMultipart(file: any, presignResult: any): Promise<void> {
    const { sessionId, partSize, partCount } = presignResult;
    const size = file.size || file.data?.size || 0;
    const parts: Array<{ partNumber: number; etag: string }> = [];

    let totalUploaded = 0;

    for (let i = 0; i < partCount; i++) {
      const partNumber = i + 1;
      const start = i * partSize;
      const end = Math.min(start + partSize, size);
      const partBlob = file.data.slice(start, end);

      // Get presigned URL for this part
      const { presignedUrl } = await this.apiCall('/uploads/multipart/part-url', {
        sessionId,
        partNumber,
      });

      // Upload part
      const res = await fetch(presignedUrl, {
        method: 'PUT',
        body: partBlob,
      });

      if (!res.ok) {
        throw new Error(`Part ${partNumber} upload failed: ${res.status}`);
      }

      const etag = res.headers.get('ETag') || '';
      parts.push({ partNumber, etag: etag.replace(/"/g, '') });

      totalUploaded += end - start;
      const percentage = Math.round((totalUploaded / size) * 100);
      this.uppy.setFileState(file.id, {
        progress: {
          uploadStarted: Date.now(),
          uploadComplete: false,
          percentage,
          bytesUploaded: totalUploaded,
          bytesTotal: size,
        },
      });
      // @ts-ignore
      this.uppy.calculateTotalProgress?.();
      this.uppy.emit('upload-progress', this.uppy.getFile(file.id), {
        uploader: this,
        bytesUploaded: totalUploaded,
        bytesTotal: size,
      });
    }

    // Complete multipart upload
    await this.apiCall('/uploads/multipart/complete', {
      sessionId,
      parts,
    });
  }
}
