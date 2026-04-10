// window.blocklet is already set in index.html <script> (must run before module imports)
import { createRoot } from 'react-dom/client';

// @ts-ignore - jsx file
import App from 'image-bin-src/app';

createRoot(document.getElementById('root')!).render(<App />);
