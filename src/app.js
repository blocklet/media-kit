import React from 'react';
import get from 'lodash/get';
import { MuiThemeProvider, CssBaseline } from '@material-ui/core';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import theme from './libs/theme';
import { SessionProvider } from './contexts/session';

import Home from './pages/home';
import About from './pages/about';

const GlobalStyle = createGlobalStyle`
  body {
    min-height: 100%;
    background-color: #484d5d !important;
    background-image: url(/images/bg.png);
    text-align: center;
    color: #070c16;
    padding: 0;
    margin: 0;
  }
  a {
    color: ${theme.palette.primary.main};
    text-decoration: none !important;
  }
  a:hover,
  a:hover * {
    text-decoration: none !important;
  }
`;

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <ThemeProvider theme={theme}>
        <SessionProvider serviceHost={get(window, 'blocklet.prefix', '/')}>
          <CssBaseline />
          <GlobalStyle />
          <div className="app">
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/home" element={<Home />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </SessionProvider>
      </ThemeProvider>
    </MuiThemeProvider>
  );
}

const WrappedApp = App;

export default () => {
  // While the blocklet is deploy to a sub path, this will be work properly.
  const basename = window?.blocklet?.prefix || '/';

  return (
    <Router basename={basename}>
      <WrappedApp />
    </Router>
  );
};
