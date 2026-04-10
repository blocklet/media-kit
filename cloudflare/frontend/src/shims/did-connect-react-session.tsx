/**
 * Shim for @arcblock/did-connect-react/lib/Session
 * Uses real DID Connect session with login_token cookie for HTTPS.
 * Note: /.well-known/service/* paths are global (no prefix) — they're the auth service.
 */
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import axios from 'axios';

interface SessionUser {
  did: string;
  role: string;
  fullName: string;
  avatar: string;
}

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
  error: Error | null;
}

const SessionContext = createContext<any>({
  session: { user: null, loading: true, error: null },
  login: () => {},
  logout: () => {},
});

function SessionProvider({
  children,
  serviceHost: _serviceHost,
  protectedRoutes,
}: {
  children: ReactNode;
  serviceHost?: string;
  protectedRoutes?: string[];
}) {
  const [session, setSession] = useState<SessionState>({ user: null, loading: true, error: null });

  const fetchSession = useCallback(async () => {
    try {
      const { data } = await axios.get('/.well-known/service/api/did/session', {
        withCredentials: true,
      });
      const user = data?.user || null;
      setSession({ user, loading: false, error: null });

      // Not authenticated — redirect to login
      if (!user) {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/.well-known/service/login?return=${returnUrl}`;
      }
    } catch {
      // Session fetch failed — redirect to login
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/.well-known/service/login?return=${returnUrl}`;
    }
  }, [protectedRoutes]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = useCallback(() => {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/.well-known/service/login?return=${returnUrl}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.get('/.well-known/service/api/did/logout', { withCredentials: true });
    } catch {
      // ignore
    }
    setSession({ user: null, loading: false, error: null });
    window.location.href = '/.well-known/service/login';
  }, []);

  const value = {
    session: { ...session, login, logout },
    login,
    logout,
  };

  // Don't render children until session is resolved — avoids flash of 403
  if (session.loading) {
    return (
      <SessionContext.Provider value={value}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1dc1c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </SessionContext.Provider>
    );
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function SessionConsumer({ children }: { children: (session: any) => ReactNode }) {
  return <SessionContext.Consumer>{children}</SessionContext.Consumer>;
}

function withSession(Component: any) {
  return function WrappedComponent(props: any) {
    return (
      <SessionContext.Consumer>
        {(ctx: any) => <Component {...props} session={ctx} />}
      </SessionContext.Consumer>
    );
  };
}

export function createAuthServiceSessionContext() {
  return { SessionProvider, SessionContext, SessionConsumer, withSession };
}
