import axios from 'axios';
import joinUrl from 'url-join';

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
  const { extension, type } = uppyFile;
  return (extension || type?.split('/')?.[1]).toLowerCase();
};

export function isBlob(file: any) {
  return file instanceof Blob;
}

export function blobToFile(blob: Blob, fileName: string) {
  const file = new File([blob], fileName, { type: blob.type });
  return file;
}

export function getDownloadUrl(src: string) {
  const url = new URL(src);
  url.searchParams.delete('w');
  url.searchParams.delete('h');
  url.searchParams.delete('q');
  return url.href;
}

// @ts-ignore
export const prefixPath = window.blocklet ? window.blocklet.prefix : '/';

export const api = axios.create();

api.interceptors.request.use(
  (config) => {
    config.baseURL = prefixPath || '/';
    config.timeout = 200000;

    return config;
  },
  (error) => Promise.reject(error)
);

export function getUploaderEndpoint(apiPath: string | undefined) {
  return joinUrl(window.location.origin, prefixPath === '/' ? '' : prefixPath, apiPath || '');
}
