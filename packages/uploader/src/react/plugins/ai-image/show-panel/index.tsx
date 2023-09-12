import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useSize } from 'ahooks';
import Prompt from './prompt';
import Output from './output';
import { AIImageProvider, AIImagePromptProps } from './context';
import { getAIKitComponent } from '../../../../utils';

interface Props {
  onSelect: (data: any) => void;
  restrictions?: any;
  api: any;
}

function AIImage({ onSelect, api, restrictions }: Props) {
  const [parameters, setParameters] = useState<AIImagePromptProps>();
  const [open, setOpen] = useState<boolean>(false);
  const onFinish = () => setParameters(undefined);
  const onClose = () => setOpen(false);
  const size = useSize(document.body);
  let isMobile = size && size.width < 768 ? true : false;

  if (!getAIKitComponent()) {
    return (
      <Box width={1} height={1} display="flex" justifyContent="center" alignItems="center">
        Install the AI Kit component first
      </Box>
    );
  }

  // isMobile
  const openPrompt = !isMobile || (isMobile && !open);
  const openOutput = !isMobile || (isMobile && open);

  const onCloseOutput = isMobile ? onClose : false;

  return (
    <AIImageProvider restrictions={restrictions}>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: '100%',
          bgcolor: '#fff',
        }}>
        <Grid container sx={{ flexGrow: 1, height: '100%' }}>
          <Grid
            item
            xs={12}
            sm={4}
            sx={{ borderRight: { sm: '1px solid #eee' }, display: openPrompt ? 'unset' : 'none' }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Prompt
                onSubmit={(...props) => {
                  setOpen(true);
                  setParameters(...props);
                }}
              />
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            sm={8}
            sx={{
              height: '100%',
              overflow: 'hidden',
              p: 2,
              display: openOutput ? 'unset' : 'none',
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
        </Grid>
      </Box>
    </AIImageProvider>
  );
}

export default AIImage;
