import { ToastProvider, Toast } from './arcblock-ux';

// Default export is Toast (the object with success/error methods)
// because actions.jsx does: import Toast from '@arcblock/ux/lib/Toast'
// while app.jsx does: import { ToastProvider } from '@arcblock/ux/lib/Toast'
export default Toast;
export { ToastProvider, Toast };
