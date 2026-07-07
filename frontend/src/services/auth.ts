import { http, refreshClient } from './http';
import type { AuthSession, AuthUser } from '@/types/auth';

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type RefreshInput = {
  refreshToken: string;
};

export const authApi = {
  async register(input: RegisterInput) {
    const { data } = await http.post<AuthSession>('/auth/register', input);
    return data;
  },
  async login(input: LoginInput) {
    const { data } = await http.post<AuthSession>('/auth/login', input);
    return data;
  },
  async refresh(input: RefreshInput) {
    const { data } = await refreshClient.post<AuthSession>('/auth/refresh', input);
    return data;
  },
  async me() {
    const { data } = await http.get<AuthUser>('/auth/me');
    return data;
  },
  async logout(refreshToken: string) {
    await http.post('/auth/logout', { refreshToken });
  }
};
