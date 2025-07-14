import React, { Suspense, lazy } from 'react'; // eslint-disable-line
import get from 'lodash/get';
import joinUrl from 'url-join';
import { CssBaseline, CircularProgress } from '@mui/material';
import { css, Global } from '@emotion/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@arcblock/ux/lib/Toast';
import Center from '@arcblock/ux/lib/Center';
import { ConfigProvider } from '@arcblock/ux/lib/Config';

import theme from './libs/theme';
import { SessionProvider } from './contexts/session';
import { UploadProvider } from './contexts/upload';
import { ResourceProvider } from './contexts/resource';
import Layout from './components/layout';
import { translations } from './locales/index';

const ImageList = lazy(() => import('./pages/images/index'));
const Home = lazy(() => import('./pages/home'));

const globalStyles = css`
  a {
    color: #e2e2e4;
    text-decoration: none !important;
  }
  a:hover,
  a:hover * {
    text-decoration: none !important;
  }
`;

export default function App() {
  // While the blocklet is deploy to a sub path, this will be work properly.
  const prefix = window?.blocklet?.prefix || '/';

  return (
    <ConfigProvider translations={translations} fallbackLocale="en" theme={theme} injectFirst>
      <Router basename={prefix}>
        <SessionProvider serviceHost={get(window, 'blocklet.prefix', '/')}>
          <CssBaseline />
          <Global styles={globalStyles} />
          <ToastProvider>
            <Suspense
              fallback={
                <Center>
                  <CircularProgress />
                </Center>
              }>
              <Routes>
                <Route
                  path="*"
                  element={
                    <SessionProvider
                      serviceHost={prefix}
                      protectedRoutes={['/admin', '/admin/*'].map((item) => joinUrl(prefix, item))}>
                      <UploadProvider>
                        <ResourceProvider>
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/admin" element={<Layout />}>
                              <Route index element={<ImageList />} />
                              <Route path="images" element={<ImageList />} />
                              <Route path="*" element={<Navigate to="/admin" />} />
                            </Route>
                          </Routes>
                        </ResourceProvider>
                      </UploadProvider>
                    </SessionProvider>
                  }
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </SessionProvider>
      </Router>
    </ConfigProvider>
  );
}
