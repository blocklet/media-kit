import React from 'react';
import { MuiThemeProvider, CssBaseline } from '@material-ui/core';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import theme from './libs/theme';

import Home from './pages/home';
import About from './pages/about';

const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Roboto', sans-serif;
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
