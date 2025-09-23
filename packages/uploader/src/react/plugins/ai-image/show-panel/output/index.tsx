import { FileContent } from '@aigne/core';
import styled from '@emotion/styled';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import Skeleton from '@mui/material/Skeleton';
import { Close as CloseIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useReactive, useAsyncEffect } from 'ahooks';
import { useTheme } from '@mui/material/styles';

import { useAIImageContext, AIImagePromptProps } from '../context';
import LoadingImage from './loading-image';
import Lottie from './lottie';
import keyBy from 'lodash/keyBy';

export default function Output({
  options,
  handleApi,
  onSelect,
  onFinish,
  onClose,
  isMobile,
}: {
  options?: AIImagePromptProps;
  handleApi: (data: any) => any;
  onSelect: (data?: { src: string; width?: number; alt: string }[]) => void;
  onFinish: () => void;
  onClose?: Function | boolean;
  isMobile?: boolean;
}) {
  const { loading, onLoading, restrictions, i18n } = useAIImageContext();
  const [response, setResponse] = useState<{ src: string; width?: number; alt: string }[]>([]);
  const [error, setError] = useState<Error>();
  const theme = useTheme();
  const maxNumberOfFiles = restrictions?.maxNumberOfFiles;

  const [lottieFiles, setLottieFiles] = useState<{
    error?: any;
    loading?: any;
    welcome?: any;
  }>({});

  const selected = useReactive<{ [key: string]: boolean }>({});
  const selectedUrls: string[] = Object.keys(selected).filter((key) => selected[key]);

  useEffect(() => {
    if (error && !lottieFiles.error) {
      import('./lottie-error.json').then((module) => {
        setLottieFiles((prev) => ({ ...prev, error: module.default }));
      });
    }

    if (options && !response.length && !lottieFiles.loading) {
      import('./lottie-loading.json').then((module) => {
        setLottieFiles((prev) => ({ ...prev, loading: module.default }));
      });
    }

    if (!options && !lottieFiles.welcome) {
      import('./lottie-welcome.json').then((module) => {
        setLottieFiles((prev) => ({ ...prev, welcome: module.default }));
      });
    }
  }, [error, options, response.length, lottieFiles]);

  useAsyncEffect(async () => {
    if (!options) {
      return;
    }
    setError(undefined);

    onLoading(true);
    try {
      const res = await handleApi({ ...options, outputType: 'file' });
      if (res.images) {
        const list: FileContent[] = res.images || [];
        const arr = list.map((item) => ({
          src: `data:image/png;base64,${item.data}`,
          alt: options.prompt,
        }));

        if (response) {
          setResponse([...arr, ...response]);
        } else {
          setResponse(arr);
        }
      } else {
        setError(res);
      }
    } catch (err) {
      console.error('AIImage generate error: ', err);
      setError((err as any)?.response?.data || err);
    } finally {
      onLoading(false);
      onFinish();
    }
  }, [options?.number, options?.prompt]);

  const onSelectImage = (src: string) => {
    const selectedUrls: string[] = Object.keys(selected).filter((key) => selected[key]);

    const canAdd = maxNumberOfFiles ? selectedUrls.length < maxNumberOfFiles : true;

    // Add if it can be added and doesn't already exist
    // If it already exists, then delete it
    // If it's already full and click on another image, then automatically delete the last one
    if (canAdd) {
      if (!selected[src]) {
        selected[src] = true;
      } else {
        selected[src] = false;
      }
    } else {
      const removeSrc = selectedUrls.pop();
      if (removeSrc !== src) {
        // @ts-ignore
        selected[removeSrc] = false;
      }
      selected[src] = !selected[src];
    }
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
    // get width and height from first ai image
    const loadingProps = {
      // @ts-ignore
      width: document.querySelector('.photo-item img')?.offsetWidth || 0,
      // @ts-ignore
      height: document.querySelector('.photo-item img')?.offsetHeight || 0,
    };

    return (
      <>
        {Array.from({ length: options?.number || 1 }).map((_, index) => {
          return (
            <Grid
              // eslint-disable-next-line react/no-array-index-key
              key={index}>
              <Skeleton
                className="lazy-image-skeleton"
                animation="wave"
                variant="rectangular"
                style={{
                  borderRadius: '12px',
                  ...loadingProps,
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
        <Box
          sx={{
            width: 300,
            height: 300,
            m: 'auto',
          }}>
          {lottieFiles.error && <Lottie key="error" src={lottieFiles.error} />}
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
          <Box
            sx={{
              flexGrow: 1,
              height: 0,
              overflowX: 'hidden',
              overflowY: 'auto',
            }}>
            <ResponseItemRoot sx={isMobile ? { p: 0, border: 'none !important' } : { p: 2 }}>
              <Grid spacing={2} container className="photo-wrapper">
                {loading && <Loading />}

                {response.map((item, index) => {
                  return (
                    <Grid key={item.src} className="photo-item">
                      <LoadingImage
                        {...item}
                        selected={selected[item.src]}
                        style={{
                          objectFit: 'cover',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          border: selected[item.src]
                            ? `2px solid ${theme.palette.primary.main}`
                            : '2px solid transparent',
                          WebkitUserDrag: 'none',
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
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              justifyContent: onClose ? 'space-between' : 'flex-end',
              button: {
                borderRadius: '30px',
                height: 40,
                textTransform: 'none',
              },
            }}>
            {onClose && typeof onClose === 'function' && (
              <Button color="primary" variant="outlined" onClick={onClose as any}>
                <CloseIcon />
              </Button>
            )}

            <Button
              color="primary"
              variant="contained"
              disabled={!Boolean(selectedUrls.length) || loading}
              onClick={() => {
                const responseMap = keyBy(response, 'src');
                onSelect(selectedUrls.map((src) => responseMap[src]));
              }}>
              {Boolean(selectedUrls.length) ? i18n('aiImageSelectedUse') : i18n('aiImageSelectedTip')}
            </Button>
          </Box>
        </>
      );
    }

    if (options) {
      return (
        <Box
          sx={{
            width: 220,
            height: 220,
            m: 'auto',
          }}>
          {lottieFiles.loading && <Lottie key="loading" src={lottieFiles.loading} />}
        </Box>
      );
    }

    return (
      <Box
        sx={{
          width: 300,
          height: 300,
          m: 'auto',
        }}>
        {lottieFiles.welcome && <Lottie key="welcome" src={lottieFiles.welcome} />}
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

  border: 1px solid;
  border-color: ${({ theme }: { theme: any }) => theme.palette.divider};
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
