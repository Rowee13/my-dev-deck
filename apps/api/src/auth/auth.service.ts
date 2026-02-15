import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { SetupUserDto } from './dto/setup-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  /**
   * Setup first user (only works if no users exist)
   */
  async setupFirstUser(dto: SetupUserDto) {
    // Check if any users exist
    const userCount = await this.prisma.user.count();

    if (userCount > 0) {
      throw new ForbiddenException(
        'Setup has already been completed. Users already exist.',
      );
    }

    // Hash password
    const hashedPassword = await this.hashPassword(dto.password);

    try {
      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      this.logger.log(`First user created: ${user.email}`);

      return { user };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return null;
    }

    // Return user without password
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Login user and generate tokens
   */
  async login(dto: LoginDto) {
    // Validate credentials
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const accessToken = await this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string) {
    // Hash the incoming token to compare with stored hash
    const hashedToken = this.hashRefreshToken(refreshToken);

    // Find the refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is revoked
    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke old token (one-time use)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new tokens
    const newAccessToken = await this.generateAccessToken(
      storedToken.userId,
      storedToken.user.email,
    );
    const newRefreshToken = await this.generateRefreshToken(storedToken.userId);

    this.logger.log(`Tokens refreshed for user: ${storedToken.user.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
      },
    };
  }

  /**
   * Revoke a refresh token (logout)
   */
  async revokeRefreshToken(refreshToken: string) {
    const hashedToken = this.hashRefreshToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
    });

    if (storedToken) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      this.logger.log(`Refresh token revoked for user: ${storedToken.userId}`);
    }

    return { message: 'Logout successful' };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(dto.newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens for this user (force re-login on other devices)
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    this.logger.log(`Password changed for user: ${user.email}`);

    return { message: 'Password changed successfully' };
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Generate JWT access token
   */
  private async generateAccessToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const payload = { userId, email };
    return this.jwtService.signAsync(payload, {
      expiresIn: this.config.get('JWT_ACCESS_EXPIRATION'),
    });
  }

  /**
   * Generate refresh token and store in database
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    const token = randomUUID();
    const hashedToken = this.hashRefreshToken(token);

    const expiresInDays = this.parseExpirationToDays(
      this.config.get('JWT_REFRESH_EXPIRATION'),
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store hashed token in database
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt,
      },
    });

    // Return unhashed token to client
    return token;
  }

  /**
   * Set authentication cookies (httpOnly, secure, sameSite)
   * Sets 3 cookies:
   * - accessToken: httpOnly (cannot be read by JavaScript)
   * - refreshToken: httpOnly, restricted to /api/auth/refresh
   * - tokenMeta: NOT httpOnly (contains exp/iat for frontend proactive refresh)
   */
  setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const isProduction = this.config.get('NODE_ENV') === 'production';

    // Access token cookie - httpOnly, short-lived
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (matches JWT_ACCESS_EXPIRATION default)
      path: '/',
    });

    // Refresh token cookie - httpOnly, long-lived, restricted path
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (matches JWT_REFRESH_EXPIRATION default)
      path: '/api/auth/refresh', // Only sent to refresh endpoint
    });

    // Token metadata cookie - NOT httpOnly (readable by JavaScript)
    // Used by frontend to know token expiration for proactive refresh
    const tokenPayload = this.jwtService.decode(accessToken) as any;
    res.cookie(
      'tokenMeta',
      JSON.stringify({
        exp: tokenPayload.exp,
        iat: tokenPayload.iat,
      }),
      {
        httpOnly: false, // Readable by JavaScript
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      },
    );
  }

  /**
   * Clear all authentication cookies
   * Called on logout
   */
  clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.clearCookie('tokenMeta', { path: '/' });
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Hash refresh token using SHA-256 (deterministic hashing for token lookup)
   */
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parse expiration string (e.g., "30d") to days
   */
  private parseExpirationToDays(expiration: string | undefined): number {
    if (!expiration) {
      return 30; // default to 30 days
    }
    const match = expiration.match(/^(\d+)d$/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 30; // default to 30 days
  }
}
