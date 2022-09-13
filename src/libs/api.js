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

export function createImageUrl(filename) {
  const { prefix = '/', CDN_HOST = '' } = window.blocklet;
  const obj = new URL(CDN_HOST || window.location.origin);
  obj.pathname = joinUrl(prefix, '/uploads/', filename);
  return obj.href;
}
