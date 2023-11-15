import axios from 'axios';
import joinUrl from 'url-join';

const api = axios.create();

api.interceptors.request.use(
  (config) => {
    const prefix = window.blocklet ? window.blocklet.prefix : '/';
    config.baseURL = prefix || '';
    config.timeout = 200000;

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

/**
 * @param {string} filename
 * @param {number} width
 * @param {number} height
 * @param {string} componentDid
 * @returns
 */
export function createImageUrl(filename, width = 0, height = 0, componentDid = '') {
  const { prefix = '/', CDN_HOST = '' } = window.blocklet;
  const obj = new URL(CDN_HOST || window.location.origin);
  obj.pathname = joinUrl(prefix, componentDid ? `/uploads/resources/${componentDid}` : '/uploads/', filename);

  const extension = filename.split('.').pop();
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
