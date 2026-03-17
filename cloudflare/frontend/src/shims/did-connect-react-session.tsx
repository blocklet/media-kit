/**
 * Shim for @arcblock/did-connect-react/lib/Session
 * Provides a fake session context that always returns an authenticated admin user.
 */
import { createContext, type ReactNode } from 'react';

const defaultSession = {
  session: {
    user: {
      did: 'did:abt:default-uploader',
      role: 'admin',
      fullName: 'Admin',
      avatar: '',
    },
    token: 'fake-token',
  },
  loading: false,
  error: null,
  // Common session helpers that components might call
  login: () => {},
  logout: () => {},
};

const SessionContext = createContext<any>(defaultSession);

function SessionProvider({ children }: { children: ReactNode; serviceHost?: string; protectedRoutes?: string[] }) {
  return <SessionContext.Provider value={defaultSession}>{children}</SessionContext.Provider>;
}

function SessionConsumer({ children }: { children: (session: any) => ReactNode }) {
  return <SessionContext.Consumer>{children}</SessionContext.Consumer>;
}

function withSession(Component: any) {
  return function WrappedComponent(props: any) {
    return <Component {...props} session={defaultSession} />;
  };
}

export function createAuthServiceSessionContext() {
  return { SessionProvider, SessionContext, SessionConsumer, withSession };
}
