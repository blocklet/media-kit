/* eslint-disable jsx-a11y/label-has-associated-control */
import styled from '@emotion/styled';
import Header from '@blocklet/ui-react/lib/Header';
// import SessionManager from '@arcblock/did-connect/lib/SessionManager';

import Uploader from '../components/uploader';
import UploadHistory from '../components/history';

import { UploadProvider } from '../contexts/upload';

function Home() {
  const onLogout = () => {
    window.location.reload();
  };
  return (
    <Div>
      <UploadProvider>
        <section className="splash">
          <Header className="page-header" sessionManagerProps={{ onLogout }} />
          <Uploader />
        </section>
        <section className="history">
          <UploadHistory />
        </section>
      </UploadProvider>
    </Div>
  );
}

const Div = styled.div`
  color: #e2e2e4;
  text-align: center;
  display: flex;
  flex-direction: column;
  height: 100vh;

  .splash {
    padding: 8px 32px 32px;

    .page-header {
      background: transparent;
      .MuiContainer-maxWidthLg {
        max-width: 100%;
      }
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
