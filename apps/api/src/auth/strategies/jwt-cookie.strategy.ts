import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * JWT Cookie Strategy
 *
 * Extracts JWT tokens from httpOnly cookies instead of Authorization header.
 * This provides better security against XSS attacks compared to Bearer tokens.
 *
 * Strategy name: 'jwt-cookie'
 * Cookie name: 'accessToken'
 */
@Injectable()
export class JwtCookieStrategy extends PassportStrategy(
  Strategy,
  'jwt-cookie',
) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Extract JWT from cookie instead of Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return (
            (request?.cookies as Record<string, string>)?.accessToken ?? null
          );
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate JWT payload and return user object
   * Called automatically by Passport after JWT is verified
   */
  async validate(payload: { userId: string; email: string }) {
    // Fetch user from database to ensure they still exist
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // This user object is attached to req.user
    return user;
  }
}
