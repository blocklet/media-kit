import { Toast } from '@arcblock/ux';
import { isEmpty } from 'lodash';
import { useState } from 'react';
import Dialog from '@arcblock/ux/lib/Dialog';
import Button from '@arcblock/ux/lib/Button';
import { TextField } from '@mui/material';

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
    const url = new URL(window.location.href);

    const endpoint = url.searchParams.get('endpoint');

    if (isEmpty(endpoint)) {
      Toast.error('Storage endpoint not found');
    }

    Toast.success('Storage endpoint saved');
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
    <>
      <button onClick={handleGetStorageEndpoint} type="button" className="submit">
        Get storage endpoint
      </button>
      <button onClick={handleSaveStorageEndpoint} type="button" className="submit">
        Save storage endpoint
      </button>

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
    </>
  );
}

export default StorageAction;
