import PropTypes from 'prop-types';
import { Outlet, useNavigate } from 'react-router-dom';
import Dashboard from '@blocklet/ui-react/lib/Dashboard';
import styled from '@emotion/styled';
import Result from '@arcblock/ux/lib/Result';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Header from '@blocklet/ui-react/lib/Header';
import Container from '@mui/material/Container';
import Footer from '@blocklet/ui-react/lib/Footer';
import { useMemo } from 'react';
import { joinURL } from 'ufo';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { UploaderProviderWrapper } from './uploader';
// import Exporter from './exporter';
import { useSessionContext } from '../contexts/session';
import { hasAdminPermission, hasMediaKitAccessPermission } from '../libs/utils';

export default function Layout({ title = window.blocklet.appName }) {
  const { session } = useSessionContext();
  const { pathname } = window.location;
  const navigate = useNavigate();
  const hadLogin = !!session?.user;
  const { t } = useLocaleContext();

  const addons = [];

  const adminPermissionInSingleTenant = hasAdminPermission(session?.user);

  const hasPermission =
    hadLogin &&
    (window?.blocklet?.tenantMode === 'multiple' ||
      adminPermissionInSingleTenant ||
      hasMediaKitAccessPermission(session?.user));

  const DashWrapper = useMemo(() => {
    return adminPermissionInSingleTenant
      ? // eslint-disable-next-line no-use-before-define
        StyledDashboard
      : ({ children }) => (
          <Box sx={{ height: '100vh', overflowY: 'hidden' }}>
            <Header
              sx={{
                borderBottom: '1px solid #eee',
              }}
            />
            <Container
              sx={{
                paddingTop: '24px',
                height: 'calc(100vh - 64px - 68px + 46px)',
                overflowY: 'hidden',
              }}>
              {children}
            </Container>
            <Footer />
          </Box>
        );
  }, [adminPermissionInSingleTenant]);

  return (
    <UploaderProviderWrapper>
      <Box
        sx={
          !adminPermissionInSingleTenant
            ? {
                '.dashboard-sidebar': {
                  display: 'none !important',
                },
              }
            : {
                width: '100%',
                height: '100vh',
                overflowY: 'hidden',
              }
        }>
        <DashWrapper
          id="media-kit-layout"
          dense
          appPath={pathname.endsWith('/admin') ? joinURL(pathname, 'images') : pathname}
          title={title}
          headerAddons={(exists) => {
            return [addons, ...exists];
          }}>
          {hasPermission ? (
            <Outlet />
          ) : (
            <Result
              status="403"
              sx={{ height: 'calc(100% - 24px)', backgroundColor: 'background.default' }}
              extra={
                <Button
                  color="primary"
                  onClick={() => {
                    // logout and redirect to home
                    session.logout().then(() => {
                      navigate('/');
                    });
                  }}>
                  {t('common.goHome')}
                </Button>
              }
            />
          )}
        </DashWrapper>
      </Box>
    </UploaderProviderWrapper>
  );
}

const StyledDashboard = styled(Dashboard)`
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
    overflow-y: auto;
  }

  .dashboard-content {
    max-width: 1680px;
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
