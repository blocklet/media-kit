/* eslint-disable no-return-assign */
import styled from '@emotion/styled';
import { useReactive, useDebounceFn } from 'ahooks';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useMemo } from 'react';

import { useAIImageContext, AIImagePromptProps } from './context';
import { Select, MenuItem, FormControl } from '@mui/material';

import anthropic from '../../logo/anthropic.png?url';
import bedrock from '../../logo/bedrock.png?url';
import deepseek from '../../logo/deepseek.png?url';
import doubao from '../../logo/doubao.png?url';
import gemini from '../../logo/gemini.png?url';
import google from '../../logo/google.png?url';
import ideogram from '../../logo/ideogram.png?url';
import ollama from '../../logo/ollama.png?url';
import openai from '../../logo/openai.png?url';
import openrouter from '../../logo/openrouter.png?url';
import poe from '../../logo/poe.png?url';
import xai from '../../logo/xai.png?url';

const map = {
  'anthropic': anthropic,
  'bedrock': bedrock,
  'deepseek': deepseek,
  'doubao': doubao,
  'gemini': gemini,
  'google': google,
  'ideogram': ideogram,
  'ollama': ollama,
  'openai': openai,
  'openrouter': openrouter,
  'poe': poe,
  'xai': xai,
};

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
        <Box sx={{ mx:2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography
            gutterBottom
            className="title label"
            sx={{
              color: 'text.primary',
            }}>
            {i18n('aiImagePrompt')}
          </Typography>

          <TextField
            sx={{ width: 1 }}
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

        <Box sx={{ px:2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography
            gutterBottom
            className="title label"
            sx={{
              color: 'text.primary',
            }}>
            {`${i18n('aiImageModel')}`}
          </Typography>

          <FormControl fullWidth size="small">
            <Select
              sx={{ width: 1 }}
              value={values.model}
              onChange={(e) => {
                values.number = 1;
                values.model = e.target.value;
              }}
              MenuProps={{
                disablePortal: true,
              }}
              renderValue={(selected) => {
                const selectedModel = models.find(item => `${item.provider}/${item.model}` === selected);
                if (!selectedModel) return selected;
                
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      component="img"
                      src={map[selectedModel.provider as keyof typeof map]} 
                      alt={selectedModel.provider} 
                      style={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: '2px',
                        objectFit: 'contain',
                        backgroundColor: 'transparent',
                      }} 
                    />
                    <Typography variant="body2">
                      {selectedModel.model}
                    </Typography>
                  </Box>
                );
              }}
            >
              {models.map((item) => (
                <MenuItem key={`${item.provider}/${item.model}`} value={`${item.provider}/${item.model}`}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Box 
                      component="img"
                      src={map[item.provider as keyof typeof map]} 
                      alt={item.provider} 
                      style={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: '2px',
                        objectFit: 'contain',
                        backgroundColor: 'transparent',
                      }} 
                    />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {item.model}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
