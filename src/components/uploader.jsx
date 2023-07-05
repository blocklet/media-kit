/* eslint-disable jsx-a11y/alt-text */
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
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

// services
uppload.use([
  new Local({ mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/bmp', 'image/webp'] }),
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
  const [url, setUrl] = useState('');
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
    <Div>
      <div className="splash-instructions">
        {!!url && (
          <div className="preview-image">
            <object alt="preview" data={url} />
          </div>
        )}
        {!url && (
          <div className="splash-image">
            <div className="image-regular" />
            <div className="image-shine" />
          </div>
        )}
        <p>Upload new image to {window.blocklet.appName}</p>
      </div>
      <div className="splash-controls">
        <button onClick={handleOpen} type="button" className="submit">
          Upload Image
        </button>
      </div>
    </Div>
  );
}

const Div = styled.div`
  .splash-instructions {
    text-align: center;
    color: #070c16;

    p {
      font-size: 24px;
      font-weight: bold;
      line-height: 1.6em;
      text-shadow: 0 1px 1px rgb(255 255 255 / 12%);
      margin-bottom: 15px;
      margin-top: 5px;
      line-height: 1.4em;
    }

    .splash-image {
      position: relative;
      width: 300px;
      height: 280px;
      margin: 0 auto;
    }

    .image-regular,
    .image-shine {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background-size: 100%;
      background-repeat: no-repeat;
    }

    .preview-image {
      width: 300px;
      height: 280px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      align-items: center;

      object {
        width: auto;
        height: auto;
        max-width: 320px;
        max-height: 280px;
      }
    }

    .image-regular {
      background-image: url(./images/splash-image.png);
    }
    .image-shine {
      transition: opacity 1s;
    }
  }

  .splash-controls {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    .submit {
      padding: 12px 24px;
      border-radius: 5px;
      cursor: pointer;
      color: #eee;
      width: 100%;
      max-width: 320px;
      text-shadow: 0 1px 0 black;
      text-decoration: none;
      font-size: 1.2rem;
      background-image: linear-gradient(transparent, rgba(0, 0, 0, 0.2));
      border: 1px solid #000000;
      background-color: #166f16;
      box-shadow: inset 0 1px 1px rgb(255 255 255 / 15%), inset 0 0 5px rgb(255 255 255 / 5%), 0 0 5px rgb(0 0 25 / 50%),
        0 5px 10px rgb(0 0 25 / 30%);
    }

    .url {
      -webkit-appearance: none;
      text-align: left;
      cursor: pointer;
      background-color: #050607;
      color: rgba(255, 255, 255, 0.7);
      border: 1px solid black;
      padding: 12px 24px;
      border-radius: 3px;
      width: 100%;
      margin-right: 8px;
      max-width: 640px;
      box-shadow: 1px 1px 1px rgb(255 255 255 / 10%), 0 0 5px rgb(255 255 255 / 5%), inset 0 0 5px rgb(0 0 0 / 50%),
        inset 5px 5px 10px rgb(0 0 0 / 30%);

      &:focus {
        outline: none;
      }
    }

    .copy-button {
      margin: 24px auto 0;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }
  }
`;
