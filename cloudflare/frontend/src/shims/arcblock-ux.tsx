/**
 * Shim for @arcblock/ux components
 * Provides minimal implementations of all used components.
 */
import { createContext, useContext, useState, type ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MuiButton from '@mui/material/Button';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogTitle from '@mui/material/DialogTitle';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ButtonGroup from '@mui/material/ButtonGroup';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useRef } from 'react';

// --- Toast ---
let toastFn: ((msg: string, severity: 'success' | 'error' | 'info' | 'warning') => void) | null = null;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  toastFn = (msg, sev) => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  return (
    <>
      {children}
      <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={severity} onClose={() => setOpen(false)}>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
}

export const Toast = {
  success: (msg: string) => toastFn?.(msg, 'success'),
  error: (msg: string) => toastFn?.(msg, 'error'),
  info: (msg: string) => toastFn?.(msg, 'info'),
  warning: (msg: string) => toastFn?.(msg, 'warning'),
};

// --- Center ---
export function Center({ children, ...props }: any) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" {...props}>
      {children || <CircularProgress />}
    </Box>
  );
}

// --- ConfigProvider ---
const defaultTheme = createTheme();

export function ConfigProvider({ children, translations, fallbackLocale, theme, injectFirst }: any) {
  const muiTheme = theme ? createTheme(theme) : defaultTheme;
  return (
    <ThemeProvider theme={muiTheme}>
      <LocaleProvider translations={translations} fallbackLocale={fallbackLocale}>
        {children}
      </LocaleProvider>
    </ThemeProvider>
  );
}

// --- Locale Context ---
const LocaleContext = createContext<any>({ locale: 'en', t: (key: string, data?: any) => key, changeLocale: () => {} });

function LocaleProvider({ children, translations, fallbackLocale }: any) {
  const [locale, setLocale] = useState(fallbackLocale || 'en');

  const t = (key: string, data?: any) => {
    // Translations are pre-flattened (e.g. { 'common.buckets': 'Buckets' })
    let val = translations?.[locale]?.[key];
    if (val === undefined) {
      val = translations?.[fallbackLocale || 'en']?.[key];
    }
    if (typeof val === 'string' && data) {
      return Object.entries(data).reduce((s: string, [k, v]) => s.replace(`{${k}}`, String(v)), val);
    }
    return val || key;
  };

  return (
    <LocaleContext.Provider value={{ locale, t, changeLocale: setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocaleContext() {
  return useContext(LocaleContext);
}

// --- withTracker ---
export function withTracker(Component: any) {
  return Component;
}

// --- Result ---
export function Result({ status, title, extra }: any) {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h4" gutterBottom>{status}</Typography>
      <Typography variant="body1" gutterBottom>{title}</Typography>
      {extra && <Box sx={{ mt: 2 }}>{extra}</Box>}
    </Box>
  );
}

// --- Button (wraps MUI Button) ---
export function Button(props: any) {
  return <MuiButton {...props} />;
}

// --- SplitButton ---
// Original API: <SplitButton menu={[{ children, onClick, disabled }]} onClick={...}>label</SplitButton>
export function SplitButton({ children, menu, options, onClick, size, variant, color, ...rest }: any) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const items = menu || options || [];

  return (
    <>
      <ButtonGroup variant={variant || 'outlined'} color={color} size={size} {...rest}>
        <MuiButton onClick={onClick} size={size}>{children}</MuiButton>
        <MuiButton size={size} onClick={(e) => setAnchorEl(e.currentTarget)}>
          <ArrowDropDownIcon />
        </MuiButton>
      </ButtonGroup>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {items.map((item: any, i: number) => (
          <MenuItem
            key={i}
            disabled={item.disabled}
            onClick={() => {
              setAnchorEl(null);
              item.onClick?.();
            }}>
            {item.children || item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// --- Confirm Dialog ---
export function Confirm({ open, title, onConfirm, onCancel, children, ...props }: any) {
  return (
    <MuiDialog open={!!open} onClose={onCancel} {...props}>
      {title && <MuiDialogTitle>{title}</MuiDialogTitle>}
      <MuiDialogContent>{children}</MuiDialogContent>
      <MuiDialogActions>
        <MuiButton onClick={onCancel}>Cancel</MuiButton>
        <MuiButton onClick={onConfirm} variant="contained" color="primary">Confirm</MuiButton>
      </MuiDialogActions>
    </MuiDialog>
  );
}

// --- Empty ---
export function Empty({ children, ...props }: any) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }} {...props}>
      <Typography variant="body1">{children || 'No data'}</Typography>
    </Box>
  );
}

// Default export fallback for any unmatched import
export default { Toast, ToastProvider, Center, ConfigProvider, useLocaleContext, withTracker, Result, Button, SplitButton, Confirm, Empty };
