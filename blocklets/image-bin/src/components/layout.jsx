import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';
import Dashboard from '@blocklet/ui-react/lib/Dashboard';
import styled from '@emotion/styled';

import Uploader from './uploader';

export default function Layout({ title }) {
  return (
    <Main
      dense
      title={title}
      headerAddons={(exists) => {
        return [
          <Uploader key="uploader-addon" />,
          // ...exists,
          exists?.[1], // FIXME: hidden locale before i18n ready
        ];
      }}>
      <Outlet />
    </Main>
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
