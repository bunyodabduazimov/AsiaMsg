import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
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
      throw new AppError('Account already exists. Please sign in.', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.authRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash
    });

    return this.issueTokensForUser(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new AppError('Account not found or wrong password', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Account not found or wrong password', 401);
    }

    return this.issueTokensForUser(user);
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google Sign-In is not configured on server', 500);
    }

    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!tokenInfoResponse.ok) {
      throw new AppError('Invalid Google token', 401);
    }

    const payload = (await tokenInfoResponse.json()) as {
      aud?: string;
      email?: string;
      email_verified?: string;
      name?: string;
      exp?: string;
    };

    if (payload.aud !== env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google token audience mismatch', 401);
    }

    if (!payload.exp || Number(payload.exp) * 1000 <= Date.now()) {
      throw new AppError('Google token expired', 401);
    }

    const email = payload.email?.trim().toLowerCase();
    const name = payload.name?.trim();
    const isEmailVerified = payload.email_verified === 'true';

    if (!email || !isEmailVerified) {
      throw new AppError('Google account email is not verified', 401);
    }

    let user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      const generatedPasswordHash = await bcrypt.hash(`${email}:${Date.now()}`, 12);
      user = await this.authRepository.createUser({
        name: name || 'Google User',
        email,
        passwordHash: generatedPasswordHash
      });
    }

    return this.issueTokensForUser(user);
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

  private async issueTokensForUser(user: User): Promise<AuthResponse> {
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

  private async issueTokens(userId: string): Promise<AuthResponse> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    return this.issueTokensForUser(user);
  }
}
