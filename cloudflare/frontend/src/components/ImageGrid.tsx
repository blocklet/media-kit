import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import Snackbar from '@mui/material/Snackbar';
import prettyBytes from 'pretty-bytes';
import { format as timeago } from 'timeago.js';
import { getImageUrl } from '../api';

interface Upload {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  created_at: string;
  url?: string;
}

interface Props {
  uploads: Upload[];
  onDelete: (id: string) => void;
}

function isImage(mimetype: string) {
  return mimetype?.startsWith('image/');
}

function isVideo(mimetype: string) {
  return mimetype?.startsWith('video/');
}

export default function ImageGrid({ uploads, onDelete }: Props) {
  const [snackMsg, setSnackMsg] = useState('');

  const copyUrl = (filename: string) => {
    const url = `${window.location.origin}${getImageUrl(filename)}`;
    navigator.clipboard.writeText(url);
    setSnackMsg('URL copied');
  };

  const download = (filename: string, originalname: string) => {
    const a = document.createElement('a');
    a.href = getImageUrl(filename);
    a.download = originalname;
    a.click();
  };

  if (uploads.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="h6">No files uploaded yet</Typography>
        <Typography variant="body2">Click "Upload" to add files</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
        {uploads.map((item) => (
          <Card key={item.id} sx={{ overflow: 'hidden' }}>
            {isImage(item.mimetype) ? (
              <CardMedia
                component="img"
                height={160}
                image={getImageUrl(item.filename)}
                alt={item.originalname}
                sx={{ objectFit: 'cover' }}
              />
            ) : isVideo(item.mimetype) ? (
              <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                <video src={getImageUrl(item.filename)} style={{ maxHeight: 160, maxWidth: '100%' }} />
              </Box>
            ) : (
              <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="text.secondary">
                  {item.mimetype || 'File'}
                </Typography>
              </Box>
            )}
            <Box sx={{ px: 1.5, py: 1 }}>
              <Tooltip title={item.originalname}>
                <Typography variant="body2" noWrap>
                  {item.originalname}
                </Typography>
              </Tooltip>
              <Typography variant="caption" color="text.secondary">
                {prettyBytes(item.size || 0)} · {timeago(item.created_at)}
              </Typography>
            </Box>
            <CardActions sx={{ pt: 0 }}>
              <Tooltip title="Copy URL">
                <IconButton size="small" onClick={() => copyUrl(item.filename)}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton size="small" onClick={() => download(item.filename, item.originalname)}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => onDelete(item.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </CardActions>
          </Card>
        ))}
      </Box>
      <Snackbar
        open={!!snackMsg}
        autoHideDuration={2000}
        onClose={() => setSnackMsg('')}
        message={snackMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
