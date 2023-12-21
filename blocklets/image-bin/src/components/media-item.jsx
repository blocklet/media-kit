/* eslint-disable react/prop-types */
import ReactPlayer from 'react-player';
import { createImageUrl } from '../libs/api';

function MediaItem(props) {
  const { mimetype, filename, originalname, _id, componentDid } = props;

  const isVideo = ['mp4', 'webm'].includes(mimetype?.split('/')?.[1]);

  const src = createImageUrl(filename, isVideo ? 0 : 500, 0, componentDid);

  const style = {
    WebkitUserDrag: 'none',
    objectFit: isVideo ? 'contain' : 'cover',
    background: 'repeating-conic-gradient(#bdbdbd33 0 25%,#fff 0 50%) 50%/16px 16px',
  };

  return isVideo ? (
    <ReactPlayer url={src} controls style={style} width="100%" height="100%" />
  ) : (
    // eslint-disable-next-line jsx-a11y/alt-text
    <object
      type={mimetype || 'image/png'} // set mime type that file not auto download, try to fallback to image/png
      key={_id}
      width="100%"
      height="100%"
      data={src}
      alt={originalname}
      loading="lazy"
      style={style}
    />
  );
}

export default MediaItem;
