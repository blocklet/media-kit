import { useState, useEffect, useCallback } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import api from './api';
import UploadButton from './components/UploadButton';
import ImageGrid from './components/ImageGrid';
import FolderList from './components/FolderList';

interface Upload {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  created_at: string;
}

interface Folder {
  id: string;
  name: string;
}

export default function App() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const pageSize = 20;

  const fetchUploads = useCallback(
    async (p = 1, append = false) => {
      setLoading(true);
      try {
        const params: any = { page: p, pageSize };
        if (selectedFolder) params.folderId = selectedFolder;
        const { data } = await api.get('/api/uploads', { params });
        const list = data.data || [];
        setUploads(append ? (prev) => [...prev, ...list] : list);
        setHasMore(list.length >= pageSize);
        setPage(p);
      } finally {
        setLoading(false);
      }
    },
    [selectedFolder]
  );

  const fetchFolders = async () => {
    try {
      const { data } = await api.get('/api/folders');
      setFolders(data.data || data || []);
    } catch {
      // folders endpoint may not exist yet
    }
  };

  useEffect(() => {
    fetchUploads(1);
  }, [fetchUploads]);

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleUploadFinish = () => {
    fetchUploads(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/api/uploads/${deleteTarget}`);
    setDeleteTarget(null);
    fetchUploads(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchUploads(page + 1, true);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Media Kit
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FolderList
            folders={folders}
            selectedFolder={selectedFolder}
            onSelect={(id) => setSelectedFolder(id)}
            onCreated={fetchFolders}
          />
          <UploadButton folderId={selectedFolder} onUploadFinish={handleUploadFinish} />
        </Box>

        <ImageGrid uploads={uploads} onDelete={(id) => setDeleteTarget(id)} />

        {loading && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && hasMore && uploads.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Button onClick={loadMore}>Load More</Button>
          </Box>
        )}
      </Container>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>Are you sure you want to delete this file?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
