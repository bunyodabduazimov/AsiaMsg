import type { AuthSession, AuthUser } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'asiamsg.accessToken';
const REFRESH_TOKEN_KEY = 'asiamsg.refreshToken';
const USER_KEY = 'asiamsg.user';

export const authStore = {
  getSession(): AuthSession | null {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);

    if (!accessToken || !refreshToken || !userRaw) {
      return null;
    }

    try {
      return {
        accessToken,
        refreshToken,
        user: JSON.parse(userRaw) as AuthUser
      };
    } catch {
      return null;
    }
  },
  saveSession(session: AuthSession) {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  },
  clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
};
