/**
 * Shim for @blocklet/ui-react/lib/Header
 * Simple app bar header.
 */
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

export default function Header(props: any) {
  const appName = (window as any).blocklet?.appName || 'Media Kit';
  return (
    <AppBar position="static" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }} {...props}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {appName}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
