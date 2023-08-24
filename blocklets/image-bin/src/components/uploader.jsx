/* eslint-disable jsx-a11y/alt-text */
import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@arcblock/ux/lib/Button';
import joinUrl from 'url-join';
import {
  en,
  xhrUploader,
  Uppload,
  Local,
  Preview,
  Camera,
  Rotate,
  Crop,
  Blur,
  Contrast,
  Grayscale,
  Saturate,
  Twitter,
  Facebook,
  Screenshot,
  URL,
} from 'uppload';
import 'uppload/dist/uppload.css';
import 'uppload/dist/themes/light.css';

import { useUploadContext } from '../contexts/upload';
import api from '../libs/api';

const obj = new window.URL(window.location.origin);
obj.pathname = joinUrl(window.blocklet.prefix, '/api/uploads');

const uppload = new Uppload({
  lang: en,
  defaultService: 'local',
  maxWidth: +(window.blocklet.MAX_IMAGE_WIDTH || 1440),
  maxHeight: +(window.blocklet.MAX_IMAGE_HEIGHT || 900),
  compressionFromMimes: [],
  uploader: xhrUploader({
    endpoint: obj.href,
    fileKeyName: 'image',
  }),
});

const defaultTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/bmp', 'image/webp'];

// services
uppload.use([
  new Local({
    mimeTypes: Array.isArray(window.blocklet.preferences.types) ? window.blocklet.preferences.types : defaultTypes,
  }),
  new Camera(),
  new Screenshot(),
  new URL(),
  new Twitter(),
  new Facebook(),
]);

// effects
uppload.use([new Preview(), new Rotate(), new Crop(), new Blur(), new Contrast(), new Grayscale(), new Saturate()]);

export default function Uploader() {
  const { prependUpload } = useUploadContext();
  const activeService = useRef('local');
  const uploading = useRef(false);
  const [, setUrl] = useState('');
  useEffect(() => {
    uppload.on('close', () => {
      if (uploading.current) {
        uploading.current = false;
      } else {
        activeService.current = uppload.activeService;
      }
    });
    uppload.on('before-upload', () => {
      uploading.current = true;
      activeService.current = uppload.activeService;
    });
    uppload.on('upload', async (doc) => {
      setUrl(doc);
      try {
        const { data } = await api.get(`/api/uploads/${doc.split('/').pop()}`);
        prependUpload(data);
      } catch (e) {
        console.error(e);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleOpen = useCallback(() => {
    uppload.open();
    uppload.navigate(activeService.current || 'local');
  }, []);

  return (
    <Button
      variant="contained"
      color="secondary"
      onClick={handleOpen}
      type="button"
      className="submit"
      style={{ marginRight: 16 }}>
      Upload to Media Library
    </Button>
  );
}
