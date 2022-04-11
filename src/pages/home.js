/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import styled from 'styled-components';

import Uploader from '../components/uploader';

const Home = () => {
  return (
    <Div>
      <section className="splash">
        <h1 className="page-title">
          ImageBin<span> - Easy Image Uploads</span>
        </h1>
        <Uploader />
      </section>
    </Div>
  );
};

const Div = styled.div`
  color: #e2e2e4;

  .splash {
    padding: 20px;

    .page-title {
      font-size: 2em;
      margin: 0.67em 0;
      margin-top: 0;
      text-shadow: 0 3px 3px rgb(0 0 0 / 50%);
    }
  }
`;

export default Home;
