import { Toast } from '@arcblock/ux';
import { isEmpty } from 'lodash';
import { useState } from 'react';
import Dialog from '@arcblock/ux/lib/Dialog';
import Button from '@arcblock/ux/lib/Button';
import { TextField } from '@mui/material';
import styled from '@emotion/styled';
import api from '../libs/api';

function StorageAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [storageEndpointDialog, setStorageEndpointDialog] = useState(
    /**
     * @type {{
     *  didStorageUrl: string
     * }}
     */
    (null)
  );

  const handleGetStorageEndpoint = async () => {
    setStorageEndpointDialog((preValue) => ({ ...preValue, didStorageUrl: window.blocklet.DID_STORAGE_URL }));
  };
  const handleSaveStorageEndpoint = async () => {
    try {
      const url = new URL(window.location.href);

      const endpoint = url.searchParams.get('endpoint');

      if (isEmpty(endpoint)) {
        Toast.error('Storage endpoint not found');
      }

      // eslint-disable-next-line no-console
      console.log({ endpoint });

      await api.put('/api/storage-endpoint', {
        endpoint,
      });

      Toast.success('Storage endpoint saved');
    } catch (error) {
      console.error(error);
      Toast.error(error.message);
    }
  };
  const handleAuthorizeNow = async () => {
    if (isEmpty(storageEndpointDialog?.didStorageUrl)) {
      Toast.error('StorageUrl cannot be empty');
      return;
    }

    setIsLoading(true);
    const authorizeURL = new URL(storageEndpointDialog.didStorageUrl);
    authorizeURL.searchParams.set('action', 'authorize');
    authorizeURL.searchParams.set('appDid', window.blocklet.appId);
    authorizeURL.searchParams.set('appName', 'image bin');
    authorizeURL.searchParams.set('appDescription', 'image bin app');
    authorizeURL.searchParams.set('redirectUrl', new URL(window.location.href).origin);
    authorizeURL.searchParams.set('scopes', 'list:object read:object write:object');
    window.location.href = authorizeURL;
  };

  return (
    <Div>
      <div className="functions">
        <button onClick={handleGetStorageEndpoint} type="button" className="submit">
          Get storage endpoint
        </button>
      </div>
      <div className="functions">
        <button onClick={handleSaveStorageEndpoint} type="button" className="submit">
          Save storage endpoint
        </button>
      </div>

      {storageEndpointDialog && (
        <Dialog
          fullWidth
          title="input did storage url"
          open
          onClose={() => setStorageEndpointDialog(null)}
          actions={
            <div>
              <Button
                onClick={handleAuthorizeNow}
                loading={isLoading}
                disabled={isLoading || isEmpty(storageEndpointDialog?.didStorageUrl)}
                color="primary"
                autoFocus
                variant="contained"
                rounded>
                Authorize Now
              </Button>
            </div>
          }>
          <TextField
            fullWidth
            variant="outlined"
            margin="normal"
            label="storage url"
            value={storageEndpointDialog.didStorageUrl}
            onChange={(e) => setStorageEndpointDialog((x) => ({ ...x, didStorageUrl: e.target.value }))}
          />
        </Dialog>
      )}
    </Div>
  );
}

const Div = styled.div`
  .functions {
    margin-top: 8px;

    .submit {
      padding: 12px 24px;
      border-radius: 5px;
      cursor: pointer;
      color: #eee;
      width: 100%;
      max-width: 320px;
      text-shadow: 0 1px 0 black;
      text-decoration: none;
      font-size: 1.2rem;
      background-image: linear-gradient(transparent, rgba(0, 0, 0, 0.2));
      border: 1px solid #000000;
      background-color: #166f16;
      box-shadow: inset 0 1px 1px rgb(255 255 255 / 15%), inset 0 0 5px rgb(255 255 255 / 5%), 0 0 5px rgb(0 0 25 / 50%),
        0 5px 10px rgb(0 0 25 / 30%);
    }
  }
`;

export default StorageAction;
