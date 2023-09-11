import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import Prompt from './prompt';
import Output from './output';
import { AiImageProvider, AiImagePromptProps } from './context';
import { getAIKitComponent } from '../../../../utils';

interface Props {
  onSelect: (data: any) => void;
  api: any;
  width?: number | string;
  height?: number | string;
  embed?: boolean;
  disabledSize?: boolean;
}

function AiImage({ onSelect, api, width, height, embed = false, disabledSize = false }: Props) {
  const [parameters, setParameters] = useState<AiImagePromptProps>();
  const [open, setOpen] = useState<boolean>(false);
  const onFinish = () => setParameters(undefined);
  const onClose = () => setOpen(false);

  if (!getAIKitComponent()) {
    return (
      <Box width={1} height={1} display="flex" justifyContent="center" alignItems="center">
        Install the AI Kit component first
      </Box>
    );
  }

  return (
    <AiImageProvider disabledSize={disabledSize} embed={embed}>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: '100%',
          bgcolor: '#fff',
        }}>
        <Grid container sx={{ flexGrow: 1 }} spacing={{ xs: 2 }}>
          <Grid item xs={12} sm={4} sx={{ borderRight: { sm: '1px solid #eee', height: '100%' } }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Prompt onSubmit={setParameters} />
            </Box>
          </Grid>

          <Grid item xs={12} sm={8} sx={{ height: '100%', overflow: 'hidden', p: 2, pt: 4 }}>
            <Output options={parameters} handleApi={api} onSelect={onSelect} onFinish={onFinish} />
          </Grid>
        </Grid>
      </Box>
    </AiImageProvider>
  );
}

export default AiImage;
