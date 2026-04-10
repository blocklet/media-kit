/**
 * Shim for @blocklet/ui-react/lib/Footer
 * Minimal footer.
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Footer(props: any) {
  return (
    <Box component="footer" sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }} {...props}>
      <Typography variant="caption">Powered by Media Kit</Typography>
    </Box>
  );
}
