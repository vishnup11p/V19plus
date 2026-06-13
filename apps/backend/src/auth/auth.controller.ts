import { Controller, Post, Get, Body, Req, Res, UseGuards, UnauthorizedException, Query, BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions, getClearCookieOptions } from './cookie-options';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signup(
    @Body() body: SignupDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const password = body.password || body.passwordHash;
    if (!password) {
      throw new BadRequestException('Password is required');
    }
    const result = await this.authService.signup(body.email, password, body.name);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const password = body.password || body.passwordHash;
    if (!password) {
      throw new BadRequestException('Password is required');
    }
    const result = await this.authService.login(body.email, password);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('admin-login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async adminLogin(
    @Body() body: AdminLoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.adminLogin(body.email, body.password);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    return { user: result.user, accessToken: result.accessToken };
  }

  @Get('google/status')
  googleStatus() {
    return this.authService.getGoogleConfigStatus();
  }

  @Get('google/url')
  googleAuthUrl() {
    return { url: this.authService.getGoogleSignInUrl() };
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Res() res: Response
  ) {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (oauthError) {
      return res.redirect(`${frontend}/login?error=${encodeURIComponent(oauthError)}`);
    }
    if (!code) {
      return res.redirect(`${frontend}/login?error=${encodeURIComponent('Missing authorization code')}`);
    }

    try {
      const result = await this.authService.googleCallback(code);
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
      return res.redirect(`${frontend}/login?google=success`);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      return res.redirect(`${frontend}/login?error=${encodeURIComponent(msg)}`);
    }
  }

  @Post('google')
  async googleAuth(
    @Body('credential') credential: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.googleAuth(credential);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    const result = await this.authService.refresh(refreshToken);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser('userId') userId: string) {
    return this.authService.getMe(userId);
  }
}
