/**
 * Shim for @blocklet/ui-react/lib/Dashboard
 * Provides a simple layout wrapper + useAppInfo hook.
 * Must support className, styled() wrapping, and .dashboard-main class.
 */
import { createContext, useContext, forwardRef, type ReactNode } from 'react';

const AppInfoContext = createContext<any>({});

export function useAppInfo() {
  const ctx = useContext(AppInfoContext);
  return {
    updateAppInfo: () => {},
    ...ctx,
  };
}

const Dashboard = forwardRef<HTMLDivElement, any>(({ children, className, id, ...rest }, ref) => {
  return (
    <AppInfoContext.Provider value={{}}>
      <div
        ref={ref}
        id={id || 'media-kit-layout'}
        className={className}
        style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}
        {...rest}>
        <div className="dashboard-main" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </div>
      </div>
    </AppInfoContext.Provider>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
