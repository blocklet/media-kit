/* eslint-disable no-return-assign */
import styled from '@emotion/styled';
import { useReactive, useDebounceFn } from 'ahooks';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import { useMemo } from 'react';

import { useAIImageContext, AIImagePromptProps } from './context';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';

export default function Prompt({ onSubmit, models }: { onSubmit: (value: AIImagePromptProps) => void, models: {model:string, provider:string}[] }) {
  const { loading, i18n } = useAIImageContext();

  const values = useReactive<AIImagePromptProps>({
    model: '',
    prompt: '',
    number: 1,
  });

  const submit = () => {
    const submitValue = JSON.parse(JSON.stringify(values));

    const v: (number | string)[] = Object.values(values);
    const allValued = v.every((param) => !!param);
    if (allValued) {
      onSubmit(submitValue);
    }
  };

  const { run } = useDebounceFn(submit, { wait: 500 });
  const disabled = useMemo(() => {
    const submitValue = JSON.parse(JSON.stringify(values));
    return Object.values(submitValue).some((param) => !param);
  }, [JSON.stringify(values)]);

  return (
    <Root onSubmit={(e: any) => e.preventDefault()}>
      <Box sx={{ flex: 1, height: '100%', overflow: 'hidden', flexDirection: 'column',display:'flex', mt:2, gap:2}}>
        <Box sx={{ mx:2 }}>
          <Typography
            gutterBottom
            className="title label"
            sx={{
              color: 'text.primary',
            }}>
            {i18n('aiImagePrompt')}
          </Typography>

          <TextField
            sx={{ width: 1, mt: 1 }}
            size="small"
            type="text"
            required
            placeholder={i18n('aiImagePromptTip')}
            multiline
            minRows={5}
            maxRows={6}
            value={values.prompt ?? ''}
            onChange={(e: any) => {
              e.stopPropagation();
              values.prompt = e.target.value;
            }}
            slotProps={{
              htmlInput: { maxLength: 1000 },
            }}
          />
        </Box>

        <Box sx={{ px:2, overflow: 'auto' }}>
          <Typography
            gutterBottom
            className="title label"
            sx={{
              color: 'text.primary',
            }}>
            {`${i18n('aiImageModel')}`}
          </Typography>

          <RadioGroup
            sx={{ '.MuiFormControlLabel-label': { fontSize: '12px', color: 'text.primary' } }}
            value={values.model}
            onChange={(e) => {
              values.number = 1;
              values.model = e.target.value as any;
            }}>
            {models.map((item) => {
              return (
                <FormControlLabel
                  value={`${item.provider}/${item.model}`}
                  control={<Radio size="small" />}
                  key={`${item.provider}/${item.model}`}
                  label={`${item.model}`}
                />
              );
            })}
          </RadioGroup>
        </Box>
      </Box>
      <Button
        sx={{ m: 2, transition: 'all 0.3s' }}
        className={'submit-ai'}
        key={loading ? 'loading-submit' : 'submit'}
        variant="contained"
        onClick={run}
        disabled={loading || disabled}>
        {loading ? i18n('aiImageGenerating') : i18n('aiImageGenerate')}
      </Button>
    </Root>
  );
}

const Root = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .title {
    padding: 0 0 4px 1px;
  }

  .label {
    font-weight: 500;
    font-size: 15px;
    line-height: 100%;
    margin: 0;
    word-wrap: break-word;
    text-align: left;
  }

  .submit-ai {
    height: 40px;
    background: linear-gradient(90deg, #45e4fa 0%, #8a45fa 52.08%, #fa45bc 100%);
    color: #fff;
    border-radius: 30px;
    box-shadow: none;
    text-transform: none;

    &.Mui-disabled {
      color: ${({ theme }: { theme: any }) => theme.palette.text.disabled} !important;
      background: ${({ theme }: { theme: any }) => theme.palette.action.disabledBackground} !important;
    }
  }

  .MuiFormHelperText-root {
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    margin: 0;
    margin-top: 4px;
  }

  .MuiOutlinedInput-root {
    border-radius: 4px;
    padding: 0;

    textarea {
      padding: 8.5px 14px;
    }

    fieldset {
    }

    &:hover fieldset {
    }
  }
`;
