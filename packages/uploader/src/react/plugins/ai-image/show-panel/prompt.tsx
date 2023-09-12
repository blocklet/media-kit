/* eslint-disable no-return-assign */
import styled from '@emotion/styled';
import { useReactive, useDebounceFn } from 'ahooks';

import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

import { useAIImageContext, AIImagePromptProps } from './context';

const marks = [
  {
    label: 256,
    value: 256,
  },
  {
    label: 512,
    value: 512,
  },
  {
    label: 1024,
    value: 1024,
  },
];
function valueLabelFormat(value: number) {
  return marks.findIndex((mark) => mark.value === value) + 1;
}

export default function Prompt({ onSubmit }: { onSubmit: (value: AIImagePromptProps) => void }) {
  const { loading } = useAIImageContext();

  const values = useReactive<AIImagePromptProps>({
    prompt: '',
    sizeWidth: 256,
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

  const sliderWrapperProps = {
    width: '100%',
    pl: '12px',
    pr: '16px',
  };

  return (
    <Root onSubmit={(e: any) => e.preventDefault()}>
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Grid container gap={2.5}>
          <Grid item xs={12}>
            <Typography gutterBottom className="title label">
              Prompt
            </Typography>

            <TextField
              sx={{ width: 1, mt: 1 }}
              size="small"
              type="text"
              required
              // label="Prompt"
              placeholder="Please enter Prompt"
              multiline
              minRows={7}
              value={values.prompt ?? ''}
              onChange={(e: any) => {
                e.stopPropagation();
                values.prompt = e.target.value;
              }}
              inputProps={{ maxLength: 1000 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom className="title label">
              {`Size: ${values.sizeWidth}px × ${values.sizeWidth}px`}
            </Typography>

            <Grid
              container
              sx={{
                gap: 2.5,
                pt: 1,
              }}>
              <Box flex={1}>
                {/* <Typography fontSize={12}>width</Typography> */}
                <Box {...sliderWrapperProps}>
                  <Slider
                    size="small"
                    valueLabelDisplay="off"
                    marks={marks}
                    min={256}
                    max={1024}
                    defaultValue={512}
                    value={values.sizeWidth as number}
                    onChange={(e: any, newValue: string) => {
                      values.sizeWidth = Number(newValue);
                    }}
                    valueLabelFormat={valueLabelFormat}
                    step={null}
                  />
                </Box>
              </Box>

              {/* <Box flex={1}>
              <Typography fontSize={12}>height</Typography>

              <Slider
                size="small"
                valueLabelDisplay="auto"
                marks={marks}
                min={256}
                max={1024}
                defaultValue={512}
                value={values.sizeWidth as number}
                onChange={(e, newValue) => (values.sizeWidth = Number(newValue))}
                valueLabelFormat={valueLabelFormat}
                step={null}
              />
            </Box> */}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom className="title label">
              {`Number of images: ${values.number}`}
            </Typography>

            <Box {...sliderWrapperProps}>
              <Slider
                size="small"
                defaultValue={1}
                valueLabelDisplay="auto"
                step={1}
                min={1}
                max={10}
                value={values.number as number}
                onChange={(e: any, newValue: string) => {
                  e.stopPropagation();
                  values.number = Number(newValue);
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Button
        className={'submit-ai'}
        type="submit"
        variant="contained"
        onClick={run}
        disabled={loading}
        style={{ transition: 'all 0.3s' }}>
        {loading ? 'Generating...' : 'Generate'}
      </Button>
    </Root>
  );
}

const Root = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;

  .title {
    padding: 0 0 8px 1px;
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
    width: 100%;
    background: linear-gradient(90deg, #45e4fa 0%, #8a45fa 52.08%, #fa45bc 100%);
    border-radius: 30px;
    box-shadow: none;
    text-transform: none;

    &.Mui-disabled {
      color: rgba(0, 0, 0, 0.26);
      background: rgba(0, 0, 0, 0.12);
    }
  }

  .MuiFormHelperText-root {
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    color: #9397a1;
    margin: 0;
    margin-top: 4px;
  }

  .MuiOutlinedInput-root {
    background: #fbfbfb;
    border-radius: 4px;

    fieldset {
      border: 1px solid #f6f6f6;
    }

    &:hover fieldset {
      border: 1px solid #a482fe;
    }
  }

  .Mui-focused {
    &.MuiFormLabel-root {
      color: #a482fe;
    }

    &.MuiOutlinedInput-root {
      fieldset {
        border: 1px solid #a482fe;
      }
    }
  }

  .Mui-error {
    &.MuiFormLabel-root {
      color: #f16e6e;
    }

    &.MuiOutlinedInput-root + .MuiFormHelperText-root {
      color: #f16e6e;
    }

    &.MuiOutlinedInput-root {
      fieldset {
        border: 1px solid #f16e6e;
      }
    }
  }
`;
