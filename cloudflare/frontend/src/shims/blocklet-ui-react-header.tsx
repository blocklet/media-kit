/**
 * Shim for @blocklet/ui-react/lib/Header
 * Shows app name + user avatar/logout when authenticated.
 */
import { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import axios from 'axios';

interface SessionUser {
  did: string;
  fullName?: string;
  avatar?: string;
  role?: string;
}

export default function Header(props: any) {
  const appName = (window as any).blocklet?.appName || 'Media Kit';
  const [user, setUser] = useState<SessionUser | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    axios
      .get('/.well-known/service/api/did/session', { withCredentials: true })
      .then(({ data }) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setAnchorEl(null);
    try {
      await axios.get('/.well-known/service/api/did/logout', { withCredentials: true });
    } catch {}
    window.location.href = '/.well-known/service/login';
  };

  const initials = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : user?.did?.slice(-2) || '?';

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{ bgcolor: 'background.paper', color: 'text.primary' }}
      {...props}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {appName}
        </Typography>
        {user && (
          <Box>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
              <Avatar
                src={user.avatar || undefined}
                sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.main' }}>
                {initials}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={!!anchorEl}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Typography variant="body2" color="text.secondary">
                  {user.fullName || user.did}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
