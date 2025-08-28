import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { useSize, useRequest } from 'ahooks';
import Prompt from './prompt';
import Output from './output';
import { AIImageProvider, AIImagePromptProps } from './context';
import { mediaKitApi } from '../../../../utils';

interface Props {
  onSelect: (data: any) => void;
  restrictions?: any;
  api: any;
  i18n: Function;
  theme?: any;
}

function AIImage({ onSelect, api, restrictions, i18n, theme }: Props) {
  const [parameters, setParameters] = useState<AIImagePromptProps>();
  const [open, setOpen] = useState<boolean>(false);
  const onFinish = () => setParameters(undefined);
  const onClose = () => setOpen(false);
  const size = useSize(document.body);
  let isMobile = size && size.width < 768 ? true : false;

  const { data: models,loading } = useRequest(async () => {
    const response = await mediaKitApi.get('/api/image/models');
    return response.data;
  });

  // isMobile
  const openPrompt = !isMobile || (isMobile && !open);
  const openOutput = !isMobile || (isMobile && open);

  const onCloseOutput = isMobile ? onClose : false;

  return (
    <AIImageProvider restrictions={restrictions} i18n={i18n} theme={theme}>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: '100%',
          bgcolor: 'background.default',
        }}>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}><CircularProgress /></Box>}
        {!loading && <Grid container sx={{ flexGrow: 1, height: '100%' }}>
          <Grid
            sx={{
              borderRight: isMobile ? 'none' : (theme) => `1px solid ${theme.palette.divider}`,
              display: openPrompt ? 'unset' : 'none',
            }}
            size={{
              xs: 12,
              sm: 4,
            }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Prompt
                models={models || []}
                onSubmit={(...props) => {
                  setOpen(true);
                  setParameters(...props);
                }}
              />
            </Box>
          </Grid>

          <Grid
            sx={{
              height: '100%',
              overflow: 'hidden',
              p: 2,
              display: openOutput ? 'unset' : 'none',
            }}
            size={{
              xs: 12,
              sm: 8,
            }}>
            <Output
              isMobile={isMobile}
              options={parameters}
              handleApi={api}
              onSelect={onSelect}
              onFinish={onFinish}
              onClose={onCloseOutput}
            />
          </Grid>
        </Grid>}
      </Box>
    </AIImageProvider>
  );
}

export default AIImage;
