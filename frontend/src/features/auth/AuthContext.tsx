import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';
import { authApi } from '@/services/auth';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { authStore } from '@/stores/auth.store';
import type { AuthSession, AuthUser } from '@/types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const session = authStore.getSession();
      if (!session) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const currentUser = await authApi.me();
        authStore.saveSession({
          ...session,
          user: currentUser
        });
        setUser(currentUser);
        connectSocket(session.accessToken);
      } catch {
        try {
          const refreshed = await authApi.refresh({
            refreshToken: session.refreshToken
          });
          authStore.saveSession(refreshed);
          setUser(refreshed.user);
          connectSocket(refreshed.accessToken);
        } catch {
          authStore.clearSession();
          setUser(null);
          disconnectSocket();
        }
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, []);

  const applySession = (session: AuthSession) => {
    authStore.saveSession(session);
    setUser(session.user);
    connectSocket(session.accessToken);
  };

  const login = async (email: string, password: string) => {
    const session = await authApi.login({ email, password });
    applySession(session);
  };

  const register = async (name: string, email: string, password: string) => {
    const session = await authApi.register({ name, email, password });
    applySession(session);
  };

  const logout = async () => {
    const refreshToken = authStore.getRefreshToken();
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
    authStore.clearSession();
    disconnectSocket();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isBootstrapping,
      login,
      register,
      logout
    }),
    [user, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
