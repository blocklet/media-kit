/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import styled from 'styled-components';
import SessionManager from '@arcblock/did-connect/lib/SessionManager';

import Uploader from '../components/uploader';
import UploadHistory from '../components/history';
import { useSessionContext } from '../contexts/session';

const Home = () => {
  const { session } = useSessionContext();
  const onLogout = () => window.location.reload();
  return (
    <Div>
      <section className="splash">
        <div className="page-header">
          <h1 className="page-title">
            {window.blocklet.appName}
            <span> - Easy Image Uploads</span>
          </h1>
          <SessionManager session={session} onLogout={onLogout} />
        </div>
        <Uploader />
      </section>
      <section className="history">
        <UploadHistory />
      </section>
    </Div>
  );
};

const Div = styled.div`
  color: #e2e2e4;
  text-align: center;
  display: flex;
  flex-direction: column;
  height: 100vh;

  .splash {
    padding: 32px;

    .page-header {
      display: flex;
      flex-direction: row;
    }

    .page-title {
      font-size: 2em;
      margin: 0.67em 0 0.67em 64px;
      margin-top: 0;
      text-shadow: 0 3px 3px rgb(0 0 0 / 50%);
      flex: 1;
    }
  }

  .history {
    padding: 32px;
    flex: 1;
    background: rgba(0, 0, 0, 0.5);
  }
`;

export default Home;
