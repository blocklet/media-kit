/* eslint-disable react/prop-types */
import { createImageUrl } from '../libs/api';

function MediaItem(props) {
  const { mimetype, filename, originalname, _id } = props;

  const isVideo = ['mp4', 'webm'].includes(mimetype?.split('/')?.[1]);

  const src = createImageUrl(filename, isVideo ? 0 : 500);

  const style = {
    WebkitUserDrag: 'none',
    objectFit: isVideo ? 'contain' : 'cover',
  };

  return isVideo ? (
    <video key={_id} width="100%" height="100%" loading="lazy" autoPlay muted loop src={src} style={style} />
  ) : (
    // eslint-disable-next-line jsx-a11y/alt-text
    <object
      type={mimetype} // set mime type that file not auto download
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
