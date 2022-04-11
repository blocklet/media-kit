/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import styled from 'styled-components';

import Uploader from '../components/uploader';
import UploadHistory from '../components/history';

const Home = () => {
  return (
    <Div>
      <section className="splash">
        <h1 className="page-title">
          ImageBin<span> - Easy Image Uploads</span>
        </h1>
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

    .page-title {
      font-size: 2em;
      margin: 0.67em 0;
      margin-top: 0;
      text-shadow: 0 3px 3px rgb(0 0 0 / 50%);
    }
  }

  .history {
    padding: 32px;
    flex: 1;
    background: rgba(0, 0, 0, 0.5);
  }
`;

export default Home;
