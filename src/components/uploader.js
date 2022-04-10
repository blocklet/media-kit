import React from 'react';
import { Uppload, en, Local, Preview, Camera } from 'uppload';
import 'uppload/dist/uppload.css';
import 'uppload/dist/themes/light.css';

const defaultImage =
  'https://images.unsplash.com/photo-1557137848-12de044c6f84?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&ixid=eyJhcHBfaWQiOjF9&ixlib=rb-1.2.1&q=80&w=400';

const uppload = new Uppload({
  lang: en,
  defaultService: 'local',
  uploader: (file, updateProgress) =>
    new Promise((resolve) => {
      setTimeout(() => resolve(window.URL.createObjectURL(file)), 4000);
      let progress = 0;
      const interval = setInterval(() => {
        if (progress > 99) clearInterval(interval);
        updateProgress(progress++);
      }, 30);
    }),
});

uppload.use([new Local(), new Camera(), new Preview()]);

export default function Uploader() {
  const [imageUrl, setImageUrl] = React.useState(defaultImage);
  const handleOpen = () => {
    uppload.on('upload', (url) => {
      setImageUrl(url);
    });
    uppload.open();
  };

  return (
    <div>
      <img alt="" src={imageUrl} />
      <button onClick={handleOpen} type="button">
        Select another photo
      </button>
      <p>Current react URL state: {imageUrl}</p>
    </div>
  );
}
