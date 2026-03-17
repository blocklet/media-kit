/**
 * Shim for @arcblock/did-connect-react/lib/Button
 * Renders a simple login button (no DID Connect).
 */
import Button from '@mui/material/Button';

export default function ConnectButton(props: any) {
  return (
    <Button variant="contained" onClick={props.onClick} {...props}>
      {props.children || 'Login'}
    </Button>
  );
}
