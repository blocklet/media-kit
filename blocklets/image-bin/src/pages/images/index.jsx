/* eslint-disable jsx-a11y/label-has-associated-control */
import { useEffect } from 'react';
import styled from '@emotion/styled';
import { useAppInfo } from '@blocklet/ui-react/lib/Dashboard';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { useSessionContext } from '../../contexts/session';
import { useUploadContext } from '../../contexts/upload';
import Uploader from '../../components/uploader';
import UploadHistory from '../../components/history';

function ImageList() {
  const { t } = useLocaleContext();
  const { session } = useSessionContext();
  const { tab } = useUploadContext();
  const { updateAppInfo } = useAppInfo();
  const hasLoggedIn = !!session?.user;

  useEffect(() => {
    updateAppInfo({
      description: t('nav.imagesDesc'),
      actions: hasLoggedIn && tab === 'bucket' ? <Uploader key="uploader-addon" /> : null,
    });
  }, [tab, updateAppInfo, hasLoggedIn, t]);

  return (
    <Div>
      <section id="image-list" className="history">
        <UploadHistory />
      </section>
    </Div>
  );
}

const Div = styled.div`
  padding: 0 0 24px;
`;

export default ImageList;
