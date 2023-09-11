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

export const getAIKitComponent = () =>
  // @ts-ignore
  window?.blocklet?.componentMountPoints?.find((item: any) => item.did === 'z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ');

export const getImageBinComponent = () =>
  // @ts-ignore
  window?.blocklet?.componentMountPoints?.find((item: any) => item.did === 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9');

// @ts-ignore
export const imageBinMountPoint = getImageBinComponent()?.mountPoint;

// @ts-ignore
export const prefixPath = imageBinMountPoint || window?.blocklet?.prefix || '/';

export const api = axios.create();

api.interceptors.request.use(
  (config) => {
    config.baseURL = prefixPath || '/';
    config.timeout = 200000;

    return config;
  },
  (error) => Promise.reject(error)
);

export function createImageUrl(filename: string, width = 0, height = 0) {
  // @ts-ignore
  const { CDN_HOST = '' } = window?.blocklet || {};
  const obj = new URL(CDN_HOST || window.location.origin);
  obj.pathname = joinUrl(prefixPath, '/uploads/', filename);

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

export function getUploaderEndpoint(apiPath: string | undefined) {
  return joinUrl(window.location.origin, prefixPath === '/' ? '' : prefixPath, apiPath || '');
}
