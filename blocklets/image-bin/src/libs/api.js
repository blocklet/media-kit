import { createAxios } from '@blocklet/js-sdk';
import joinUrl from 'url-join';

const api = createAxios({
  timeout: 200000,
});

export default api;

export function createImageUrl(filename, width = 0, height = 0) {
  const { prefix = '/', CDN_HOST = '' } = window.blocklet;
  const obj = new URL(CDN_HOST || window.location.origin);
  obj.pathname = joinUrl(prefix, '/uploads/', filename);

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
