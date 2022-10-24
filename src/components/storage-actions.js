import { Toast } from '@arcblock/ux';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';
import Dialog from '@arcblock/ux/lib/Dialog';
import Button from '@arcblock/ux/lib/Button';
import { TextField } from '@mui/material';
import api from '../libs/api';

function StorageAction() {
  const { locale } = useLocaleContext();
  const [storageUrl, setStorageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storageEndpointDialog, setStorageEndpointDialog] = useState(
    /**
     * @type {{
     *  name: string
     * }}
     */
    (null)
  );

  const handleGetStorageEndpoint = async () => {
    if (isEmpty(storageUrl)) {
      Toast.error('StorageUrl cannot be empty');
      return;
    }

    setIsLoading(true);
    const authorizeURL = new URL(storageUrl);
    authorizeURL.searchParams.set('action', 'authorize');
    authorizeURL.searchParams.set('appDid', window.blocklet.appDid);
    authorizeURL.searchParams.set('appName', 'image bin');
    authorizeURL.searchParams.set('appDescription', 'image bin app');
    authorizeURL.searchParams.set('redirectUrl', new URL(window.location.href).origin);
    authorizeURL.searchParams.set('scopes', 'list:object,read:object,write:object');
    window.location.href = authorizeURL;
  };
  const handleSaveStorageEndpoint = async () => {};

  useEffect(() => {
    api
      .get('/api/env', {
        headers: {
          'x-locale': locale,
        },
      })
      .then((res) => {
        window.blocklet = Object.assign({}, window.blocklet, res.data);
        setStorageUrl(window.blocklet.didStorageUrl);
      });
  }, [locale]);

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
                loading={isLoading}
                disabled={isLoading || isEmpty(storageEndpointDialog?.name)}
                color="primary"
                autoFocus
                variant="contained"
                rounded>
                get endpoint
              </Button>
            </div>
          }>
          <TextField
            fullWidth
            variant="outlined"
            margin="normal"
            label="storage url"
            value={storageEndpointDialog.name}
            onChange={(e) => setStorageEndpointDialog((x) => ({ ...x, name: e.target.value }))}
          />
        </Dialog>
      )}
    </>
  );
}

export default StorageAction;
