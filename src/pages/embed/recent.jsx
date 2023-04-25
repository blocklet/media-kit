import { useCallback, useEffect, useRef, useState } from 'react';
import { css, Global } from '@emotion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useSize } from 'ahooks';
import { Scrollbar, Navigation, Mousewheel, FreeMode } from 'swiper';
import Empty from '@arcblock/ux/lib/Empty';
import { useMessage } from '@blocklet/embed/lib/message';

// Import Swiper styles
// eslint-disable-next-line import/no-unresolved
import 'swiper/css';
// eslint-disable-next-line import/no-unresolved
import 'swiper/css/free-mode';
// eslint-disable-next-line import/no-unresolved
import 'swiper/css/scrollbar';
// eslint-disable-next-line import/no-unresolved
import 'swiper/css/navigation';
import api, { createImageUrl } from '../../libs/api';

const globalStyles = css`
  body {
    background-color: unset !important;
    background-image: unset;
  }
`;

function EmbedRecent() {
  const [imageList, setImageList] = useState([]);
  const rootRef = useRef(null);
  const size = useSize(rootRef.current);
  const { message } = useMessage();
  const getData = useCallback(async () => {
    const { data } = await api.get('/api/embed/recent');
    setImageList(data);
  }, []);
  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    message?.send('resize', size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);
  return (
    <>
      <Global styles={globalStyles} />
      <div ref={rootRef}>
        {imageList.length === 0 && <Empty>No uploads found</Empty>}
        {imageList.length > 0 && (
          <Swiper
            freeMode
            navigation
            grabCursor
            mousewheel
            centerInsufficientSlides
            spaceBetween={20}
            slidesPerView="auto"
            scrollbar={{ draggable: true }}
            modules={[FreeMode, Mousewheel, Scrollbar, Navigation]}
            className="mySwiper">
            {imageList.map((item) => {
              return (
                <SwiperSlide style={{ width: '200px', height: '200px' }}>
                  <img
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    src={createImageUrl(item.filename)}
                    alt={item.originalname}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </div>
    </>
  );
}

export default EmbedRecent;
