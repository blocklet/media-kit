import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import api from '../api';

interface Folder {
  id: string;
  name: string;
}

interface Props {
  folders: Folder[];
  selectedFolder: string;
  onSelect: (id: string) => void;
  onCreated: () => void;
}

export default function FolderList({ folders, selectedFolder, onSelect, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/api/folders', { name: name.trim() });
      setName('');
      setOpen(false);
      onCreated();
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip
          icon={<FolderIcon />}
          label="All"
          variant={selectedFolder === '' ? 'filled' : 'outlined'}
          color={selectedFolder === '' ? 'primary' : 'default'}
          onClick={() => onSelect('')}
        />
        {folders.map((f) => (
          <Chip
            key={f.id}
            icon={<FolderIcon />}
            label={f.name}
            variant={selectedFolder === f.id ? 'filled' : 'outlined'}
            color={selectedFolder === f.id ? 'primary' : 'default'}
            onClick={() => onSelect(f.id)}
          />
        ))}
        <Chip icon={<AddIcon />} label="New Folder" variant="outlined" onClick={() => setOpen(true)} />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Folder Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating || !name.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
