import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';
import Dashboard from '@blocklet/ui-react/lib/Dashboard';
import styled from '@emotion/styled';
import ConnectButton from '@arcblock/did-connect/lib/Button';

import Uploader, { UploaderProviderWrapper } from './uploader';
// import Exporter from './exporter';
import { useUploadContext } from '../contexts/upload';
import { useSessionContext } from '../contexts/session';

const hasAdminPermission = (user) => ['admin', 'owner'].includes(user?.role);

export default function Layout({ title }) {
  const { tab } = useUploadContext();
  const { session } = useSessionContext();
  const hadLogin = !!session?.user;

  const addons = [];
  if (hadLogin && tab === 'bucket') {
    if (hasAdminPermission(session?.user)) {
      // addons.push(<Exporter key="exporter-addon" />);
    }
    addons.push(<Uploader key="uploader-addon" />);
  }

  return (
    <UploaderProviderWrapper>
      <Main
        dense
        title={title}
        headerAddons={(exists) => {
          return [addons, ...exists];
        }}>
        {hadLogin ? (
          <Outlet />
        ) : (
          <ConnectButton
            color="primary"
            onClick={session.login}
            style={{
              height: 'fit-content',
              width: 'fit-content',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              right: 0,
              margin: 'auto',
            }}
          />
        )}
      </Main>
    </UploaderProviderWrapper>
  );
}

const Main = styled(Dashboard)`
  position: relative;
  height: 100%;
  margin-top: 0;

  .dashboard-sidebar {
    width: 120px;
  }
  .dashboard-footer {
    margin-top: 0;
  }

  .dashboard-main {
    overflow-y: hidden;
  }

  .dashboard-content {
    max-width: 1680px;
    padding: 0 !important;
    & > div {
      padding: 0 !important;
    }
  }

  // footer
  .dashboard-content ~ div {
    margin-top: 0;
    padding: 12px 0;
  }
`;

Layout.propTypes = {
  title: PropTypes.string,
};

Layout.defaultProps = {
  title: window.blocklet.appName,
};
