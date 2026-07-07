import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { AppError } from '../middleware/error-handler';
import { createRefreshTokenValue, hashToken, signAccessToken } from '../utils/jwt';
import { AuthRepository } from './auth.repository';
import type { AuthResponse } from './auth.types';

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type RefreshInput = {
  refreshToken: string;
};

export class AuthService {
  constructor(private readonly authRepository = new AuthRepository()) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.authRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.authRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash
    });

    return this.issueTokens(user.id);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    return this.issueTokens(user.id);
  }

  async refresh(input: RefreshInput): Promise<AuthResponse> {
    const tokenHash = hashToken(input.refreshToken);
    const storedToken = await this.authRepository.findActiveRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    await this.authRepository.revokeRefreshToken(storedToken.id);
    return this.issueTokens(storedToken.userId);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const storedToken = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken || storedToken.revokedAt) {
      return;
    }

    await this.authRepository.revokeRefreshToken(storedToken.id);
  }

  async me(userId: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private async issueTokens(userId: string): Promise<AuthResponse> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const refreshToken = createRefreshTokenValue();
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);

    await this.authRepository.createRefreshToken({
      tokenHash: refreshTokenHash,
      expiresAt,
      user: {
        connect: { id: user.id }
      }
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      accessToken,
      refreshToken
    };
  }
}
