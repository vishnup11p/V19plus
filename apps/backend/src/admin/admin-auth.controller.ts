import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../auth/auth.service';
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions } from '../auth/cookie-options';
import { AdminLoginDto } from '../auth/dto/admin-login.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() body: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.adminLogin(body.email, body.password);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    return { user: result.user, accessToken: result.accessToken };
  }
}
