// @ts-ignore @uppy/utils does not ship declarations for this subpath.
import mimeTypes from '@uppy/utils/lib/mimeTypes';
// @ts-ignore @uppy/utils does not ship declarations for this subpath.
import getFileTypeExtension from '@uppy/utils/lib/getFileTypeExtension';

const extraMimeTypes: Record<string, string> = {
  '3gp': 'video/3gpp',
  aac: 'audio/aac',
  apng: 'image/apng',
  avif: 'image/avif',
  bmp: 'image/bmp',
  css: 'text/css',
  eot: 'application/vnd.ms-fontobject',
  exe: 'application/vnd.microsoft.portable-executable',
  flac: 'audio/flac',
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
  htm: 'text/html',
  html: 'text/html',
  ico: 'image/x-icon',
  iso: 'application/x-iso9660-image',
  jpeg: 'image/jpeg',
  js: 'text/javascript',
  json: 'application/json',
  m4a: 'audio/mp4',
  m4v: 'video/x-m4v',
  m2ts: 'video/mp2t',
  mid: 'audio/midi',
  midi: 'audio/midi',
  mpg: 'video/mpeg',
  mpeg: 'video/mpeg',
  msi: 'application/x-msdownload',
  ogg: 'audio/ogg',
  otf: 'font/otf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  rtf: 'application/rtf',
  ts: 'video/mp2t',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  ttf: 'font/ttf',
  wasm: 'application/wasm',
  wav: 'audio/wav',
  wma: 'audio/x-ms-wma',
  wmv: 'video/x-ms-wmv',
  woff: 'font/woff',
  woff2: 'font/woff2',
  xml: 'application/xml',
};

const extensionToMimeType: Record<string, string> = {
  ...mimeTypes,
  ...extraMimeTypes,
};

const mimeTypeToExtension = Object.entries(extensionToMimeType).reduce((acc, [extension, mimeType]) => {
  acc[mimeType] = acc[mimeType] || extension;
  return acc;
}, {} as Record<string, string>);

const getFileExtension = (value: string) => {
  const pathname = value.split(/[?#]/)[0] || '';
  const filename = pathname.split(/[\\/]/).pop() || pathname;
  const dotIndex = filename.lastIndexOf('.');

  if (dotIndex === -1 || dotIndex === filename.length - 1) {
    return '';
  }

  return filename.slice(dotIndex + 1).toLowerCase();
};

export const lookupMimeType = (value?: string | null | false) => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const input = value.trim();
  if (!input) {
    return false;
  }

  const normalizedType = input.split(';')[0].toLowerCase();
  if (!normalizedType.includes('://') && /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(normalizedType)) {
    return normalizedType;
  }

  const extension = getFileExtension(input);
  return extensionToMimeType[extension] || false;
};

export const getMimeExtension = (value?: string | null | false) => {
  const mimeType = lookupMimeType(value);
  if (!mimeType) {
    return false;
  }

  return mimeTypeToExtension[mimeType] || getFileTypeExtension(mimeType) || false;
};
