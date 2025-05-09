/* eslint-disable import/no-extraneous-dependencies */
import Skeleton from '@mui/material/Skeleton';
import { useReactive } from 'ahooks';
import IconButton from '@mui/material/IconButton';
// @ts-ignore
import ClickToCopy from '@arcblock/ux/lib/ClickToCopy';
import styled from '@emotion/styled';
import Typography from '@mui/material/Typography';
import {
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  CheckCircleTwoTone as CheckCircleTwoToneIcon,
  Delete as DeleteIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
} from '@mui/icons-material';
import Box from '@mui/material/Box';

const LoadingImage = ({
  onDelete,
  selected,
  onLoad,
  src,
  alt,
  ...rest
}: {
  onDelete: (src: string) => void;
  selected: boolean;
  onLoad?: () => void;
  src: string;
  [key: string]: any;
}) => {
  const state = useReactive({
    loading: true,
  });

  return (
    <div style={{ position: 'relative' }}>
      <Box
        className="lazy-image-wrapper"
        sx={{
          visibility: state.loading ? 'hidden' : 'visible',
          bgcolor: 'background.paper',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <img
          alt={alt}
          src={src}
          {...rest}
          onLoad={() => {
            state.loading = false;
            try {
              onLoad?.();
            } catch (error) {
              console.error('image onLoad error: ', error);
            }
          }}
          loading="eager" // must be eager to make sure the image is loaded
        />
      </Box>

      {state.loading && (
        <Skeleton
          className="lazy-image-skeleton"
          animation="wave"
          variant="rectangular"
          style={{
            position: 'absolute',
            top: 0,
          }}
        />
      )}

      <StyledIconButton onClick={() => onDelete(src)} sx={{ position: 'absolute', left: 10, bottom: 10 }}>
        <DeleteIcon sx={{ fontSize: 20 }} />
      </StyledIconButton>

      {alt && (
        // @ts-ignore
        <StyledClickToCopy
          unstyled
          tip={alt}
          sx={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            fontSize: 14,
            width: 'calc(100% - 20px - 10px - 36px)',
            display: 'flex',
            alignItems: 'center',
          }}
          arrow
          tipPlacement="top"
          PopperProps={{
            disablePortal: true,
          }}>
          <TipsAndUpdatesIcon sx={{ fontSize: 20, mr: 0.5 }} />
          <Typography
            sx={{
              fontSize: 14,
              overflowX: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
            {alt}
          </Typography>
        </StyledClickToCopy>
      )}

      <Box sx={{ position: 'absolute', right: 8, top: 8 }} onClick={rest?.onClick}>
        {selected ? (
          <CheckCircleIcon sx={{ fontSize: 30 }} />
        ) : (
          <RadioButtonUncheckedIcon sx={{ fontSize: 30, color: '#fff' }} />
        )}
      </Box>
    </div>
  );
};

export default LoadingImage;

const StyledClickToCopy = styled(ClickToCopy)`
  height: 36px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.42);
  color: #f7f8f8;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  color: #fff;
  transition: all 0.3s;

  &:hover {
    background: rgba(0, 0, 0, 0.69);
  }
`;

const StyledIconButton = styled(IconButton)`
  height: 36px;
  width: 36px;
  padding: 0;
  background: rgba(0, 0, 0, 0.42);
  color: #f7f8f8;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  transition: all 0.3s;

  &:hover {
    background: rgba(0, 0, 0, 0.69);
  }
`;

const CheckCircleIcon = styled(CheckCircleTwoToneIcon)`
  & path:first-of-type {
    fill: ${({ theme }: { theme: any }) => theme.palette?.primary?.main || '#1976d2'};
    opacity: 1;
  }
  & path:last-child {
    fill: white;
  }
`;
