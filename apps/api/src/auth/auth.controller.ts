import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SetupUserDto } from './dto/setup-user.dto';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initial user setup (only works if no users exist)' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Setup has already been completed',
  })
  async setup(@Body() dto: SetupUserDto) {
    return this.authService.setupFirstUser(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    // Set httpOnly cookies for token storage
    this.authService.setAuthCookies(res, result.accessToken, result.refreshToken);

    // Return user info and tokens (tokens for backward compatibility)
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Try to get refresh token from cookie first, fallback to body for backward compatibility
    const refreshToken =
      req.cookies?.refreshToken || dto?.refreshToken;

    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }

    const result = await this.authService.refreshTokens(refreshToken);

    // Set httpOnly cookies for token storage
    this.authService.setAuthCookies(res, result.accessToken, result.refreshToken);

    // Return user info and tokens (tokens for backward compatibility)
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  async logout(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Try to get refresh token from cookie first, fallback to body for backward compatibility
    const refreshToken =
      req.cookies?.refreshToken || dto?.refreshToken;

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    // Clear authentication cookies
    this.authService.clearAuthCookies(res);

    return { message: 'Logout successful' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect',
  })
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const userId = req.user!['id'];
    return this.authService.changePassword(userId, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
  })
  async getMe(@Req() req: Request) {
    const userId = req.user!['id'];
    return this.authService.getCurrentUser(userId);
  }
}
