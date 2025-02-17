import Header from '@blocklet/ui-react/lib/Header';
import Footer from '@blocklet/ui-react/lib/Footer';
import { useNavigate } from 'react-router-dom';
import { Box, Stack, Typography } from '@mui/material';
import ConnectButton from '@arcblock/did-connect/lib/Button';
import { useLayoutEffect } from 'react';
import { useSessionContext } from '../contexts/session';

export default function Home() {
  const { session } = useSessionContext();
  const navigate = useNavigate();
  const { blocklet } = window;

  useLayoutEffect(() => {
    if (session.user) {
      navigate('/admin');
    }
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        justifyContent: 'space-between',
      }}>
      <Header
        sx={{
          borderBottom: '1px solid #eee',
        }}
      />
      <Box mx="auto" maxWidth={800}>
        {blocklet && (
          <Stack alignItems="center" gap={2}>
            <Box component="img" src={blocklet.appLogo} alt="" width={80} />
            <Typography variant="h4">{blocklet.appName}</Typography>
            <Typography variant="caption" component="div">
              v{blocklet.version}
            </Typography>
            <Typography variant="body1" component="div">
              {blocklet.appDescription}
            </Typography>

            <Stack direction="row" gap={3}>
              <ConnectButton
                color="primary"
                onClick={async () => {
                  if (!session.user) {
                    await new Promise((resolve) => {
                      session.login(() => resolve());
                    });
                  }
                  navigate('/admin');
                }}
                variant="contained"
              />
            </Stack>
          </Stack>
        )}
      </Box>

      <Footer
        // FIXME: remove following undefined props after issue https://github.com/ArcBlock/ux/issues/1136 solved
        meta={undefined}
        theme={undefined}
      />
    </Box>
  );
}
