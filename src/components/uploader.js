import React from 'react';
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

const defaultImage =
  'https://images.unsplash.com/photo-1557137848-12de044c6f84?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&ixid=eyJhcHBfaWQiOjF9&ixlib=rb-1.2.1&q=80&w=400';

const uppload = new Uppload({
  lang: en,
  defaultService: 'local',
  maxWidth: 1440,
  maxHeight: 900,
  uploader: xhrUploader({
    endpoint: `${window.location.origin}/api/upload`,
    fileKeyName: 'image',
  }),
});

// services
uppload.use([new Local(), new Camera(), new Screenshot(), new URL(), new Twitter(), new Facebook()]);

// effects
uppload.use([new Preview(), new Rotate(), new Crop(), new Blur(), new Contrast(), new Grayscale(), new Saturate()]);

export default function Uploader() {
  const [url, setUrl] = React.useState(defaultImage);
  const handleOpen = () => {
    uppload.on('upload', setUrl);
    uppload.open();
  };

  return (
    <div>
      <img alt="" src={url} />
      <button onClick={handleOpen} type="button">
        Select another photo
      </button>
      <p>Current react URL state: {url}</p>
    </div>
  );
}
