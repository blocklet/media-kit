import styled from '@emotion/styled';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';

import { useState } from 'react';
import { useReactive, useAsyncEffect } from 'ahooks';

import { useAiImageContext, AiImagePromptProps } from '../context';
import LoadingImage from './loading-image';
import Lottie from './lottie';
import lottieJsonErrorUrl from './lottie-error.json';
import lottieJsonLoadingUrl from './lottie-loading.json';
import lottieJsonWelcomeUrl from './lottie-welcome.json';
import { api } from '../../../../../utils';

export default function Output({
  options,
  handleApi,
  onSelect,
  onFinish,
}: {
  options?: AiImagePromptProps;
  handleApi: (data: any) => any;
  onSelect: (data?: string[]) => void;
  onFinish: () => void;
}) {
  const { loading, multiple, embed, onLoading } = useAiImageContext();
  const [response, setResponse] = useState<{ src: string; width: number }[]>([]);
  const [error, setError] = useState<Error>();

  const selected = useReactive<{ [key: string]: boolean }>({});
  const selectedUrls: string[] = Object.keys(selected).filter((key) => selected[key]);

  const myApi = async (payload: any) => {
    const result = await api.post('/api/image/generations', payload);
    return result.data;
  };

  const imageWrapperProps = {
    xs: 12,
    sm: 6,
  };

  useAsyncEffect(async () => {
    if (!options) {
      return;
    }
    setError(undefined);

    onLoading(true);
    try {
      const res = await myApi({ ...options, responseFormat: embed ? 'b64_json' : 'url' });
      if (res.data) {
        const list = res.data || [];
        const arr = embed
          ? list.map((item: { b64_json: string }) => ({
              src: `data:image/png;base64,${item.b64_json}`,
              width: options.sizeWidth,
            }))
          : list.map((item: { url: string }) => ({ src: `${item.url}`, width: options.sizeWidth }));

        if (response) {
          setResponse([...arr, ...response]);
        } else {
          setResponse(arr);
        }
      } else {
        setError(res);
      }
    } catch (err) {
      console.error('AiImage generate error: ', err);
      setError((err as any)?.response?.data || err);
    } finally {
      onLoading(false);
      onFinish();
    }
  }, [options?.number, options?.prompt, options?.sizeWidth]);

  const onSelectImage = (src: string) => {
    selected[src] = !selected[src];
  };

  const onDelete = (src: string) => {
    if (response) {
      const index = response.findIndex((item) => item.src === src);
      if (index > -1) {
        selected[src] = false;
        response.splice(index, 1);
        setResponse([...response]);
      }
    }
  };

  const Loading = () => {
    return (
      <>
        {Array.from({ length: options?.number || 1 }).map((_, index) => {
          return (
            <Grid
              item
              {...imageWrapperProps}
              // eslint-disable-next-line react/no-array-index-key
              key={index}>
              <Skeleton
                className="lazy-image-skeleton"
                animation="wave"
                variant="rectangular"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                }}
              />
            </Grid>
          );
        })}
      </>
    );
  };

  const render = () => {
    if (error) {
      return (
        <Box width={300} height={300} m="auto" mt="100px">
          <Lottie key="error" src={lottieJsonErrorUrl} />
          <Box
            sx={{
              textAlign: 'center',
              color: '#25292F',
              wordBreak: 'break-all',
            }}>
            {error?.message}
          </Box>
        </Box>
      );
    }

    if (response && Array.isArray(response) && response.length > 0) {
      return (
        <>
          <Box flexGrow={1} sx={{ height: 0, overflowX: 'hidden', overflowY: 'auto' }}>
            <ResponseItemRoot sx={{ p: 2 }}>
              <Grid spacing={2} container className="photo-wrapper">
                {loading && <Loading />}

                {response.map((item, index) => {
                  return (
                    <Grid item {...imageWrapperProps} key={item.src} className="photo-item">
                      <LoadingImage
                        {...item}
                        selected={selected[item.src]}
                        style={{
                          objectFit: 'cover',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          border: selected[item.src] ? '2px solid #2482F6' : '2px solid transparent',
                          '-webkit-user-drag': 'none',
                          width: '100%',
                          height: '100%',
                        }}
                        onClick={() => {
                          onSelectImage(item.src);
                        }}
                        onDelete={() => {
                          onDelete(item.src);
                        }}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </ResponseItemRoot>
          </Box>

          <Button
            size="small"
            color="primary"
            variant="contained"
            sx={{ alignSelf: 'end', mt: 2 }}
            disabled={!Boolean(selectedUrls.length) || loading}
            onClick={() => {
              onSelect(selectedUrls);
            }}>
            {Boolean(selectedUrls.length) ? 'Use selected images' : 'Please select images'}
          </Button>
        </>
      );
    }

    if (options) {
      return (
        <Box width={200} height={200} m="auto">
          <Lottie key="loading" src={lottieJsonLoadingUrl} />
          <Box textAlign="center" color="#25292F" fontSize={14} className="tips">
            {`Generating image...`}
          </Box>
        </Box>
      );
    }

    return (
      <Box width={300} height={300} m="auto">
        <Lottie key="welcome" src={lottieJsonWelcomeUrl} />
      </Box>
    );
  };

  return <Root>{render()}</Root>;
}

const Root = styled(Box)`
  min-height: 100%;
  display: flex;
  flex-direction: column;

  .lazy-image-wrapper {
    border-radius: 12px;

    img {
      border-radius: 12px;
    }
  }

  .tips {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
`;

const ResponseItemRoot = styled(Box)`
  display: flex;
  flex-direction: column;
  background: #fbfbfb;
  border: 1px solid #f6f6f6;
  border-radius: 12px;
  min-height: 100%;

  &:has(.Mui-focused) {
    border: 1px solid #a482fe;
  }

  > .input {
    padding: 12px;
    font-weight: 500;
    font-size: 16px;
    line-height: 19px;
    color: #25292f;
  }

  > .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 12px 12px;

    > .counter {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 400;
      font-size: 12px;
      line-height: 14px;
      color: #9397a1;
    }

    > .copy {
      height: 25px;
      width: 25px;
      min-width: 0;
      padding: 0;
      color: #9397a1;
    }
  }
`;
