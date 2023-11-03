import React, { Suspense, lazy } from 'react'; // eslint-disable-line
import get from 'lodash/get';
import joinUrl from 'url-join';
import { ThemeProvider as MuiThemeProvider, StyledEngineProvider, CssBaseline, CircularProgress } from '@mui/material';
import { ThemeProvider as EmotionThemeProvider, css, Global } from '@emotion/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@arcblock/ux/lib/Toast';
import { LocaleProvider } from '@arcblock/ux/lib/Locale/context';
import Center from '@arcblock/ux/lib/Center';

import theme from './libs/theme';
import { SessionProvider } from './contexts/session';
import { UploadProvider } from './contexts/upload';
import Layout from './components/layout';
import { translations } from './locales/index';

const ImageList = lazy(() => import('./pages/images/index'));
const EmbedRecent = lazy(() => import('./pages/embed/recent'));

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
    <StyledEngineProvider injectFirst>
      <MuiThemeProvider theme={theme}>
        <EmotionThemeProvider theme={theme}>
          <LocaleProvider translations={translations} fallbackLocale="en">
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
                      <Route path="/embed/recent" element={<EmbedRecent />} />
                      <Route path="/" element={<EmbedRecent />} />
                      <Route
                        path="*"
                        element={
                          <SessionProvider
                            serviceHost={prefix}
                            protectedRoutes={['/admin'].map((item) => joinUrl(prefix, item))}>
                            <UploadProvider>
                              <Routes>
                                <Route path="/admin" element={<Layout />}>
                                  <Route path="images" element={<ImageList />} />
                                  <Route path="*" element={<Navigate to="/admin/images" />} />
                                  <Route index element={<Navigate to="/admin/images" />} />
                                </Route>
                              </Routes>
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
          </LocaleProvider>
        </EmotionThemeProvider>
      </MuiThemeProvider>
    </StyledEngineProvider>
  );
}
