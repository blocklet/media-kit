import { Suspense, lazy } from 'react';
import get from 'lodash/get';
import { ThemeProvider as MuiThemeProvider, StyledEngineProvider, CssBaseline } from '@mui/material';
import { ThemeProvider as EmotionThemeProvider, css, Global } from '@emotion/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@arcblock/ux/lib/Toast';

import theme from './libs/theme';
import { SessionProvider } from './contexts/session';

const Home = lazy(() => import('./pages/home'));
const EmbedRecent = lazy(() => import('./pages/embed/recent'));

const globalStyles = css`
  body {
    min-height: 100%;
    background-color: #484d5d !important;
    background-image: url(./images/bg.png);
    text-align: center;
    color: #e2e2e4;
    padding: 0;
    margin: 0;
  }
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
  const basename = window?.blocklet?.prefix || '/';

  return (
    <Suspense fallback={null}>
      <StyledEngineProvider injectFirst>
        <MuiThemeProvider theme={theme}>
          <EmotionThemeProvider theme={theme}>
            <Router basename={basename}>
              <SessionProvider serviceHost={get(window, 'blocklet.prefix', '/')}>
                <CssBaseline />
                <Global styles={globalStyles} />
                <ToastProvider>
                  <div className="app">
                    <Routes>
                      <Route exact path="/" element={<Navigate to="/app" />} />
                      <Route exact path="/embed/recent" element={<EmbedRecent />} />
                      <Route exact path="/app" element={<Home />} />
                      <Route path="*" element={<Navigate to="/app" />} />
                    </Routes>
                  </div>
                </ToastProvider>
              </SessionProvider>
            </Router>
          </EmotionThemeProvider>
        </MuiThemeProvider>
      </StyledEngineProvider>
    </Suspense>
  );
}
