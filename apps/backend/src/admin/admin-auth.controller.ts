import { Controller, Post, Body, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions } from '../auth/cookie-options';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password required');
    }
    const result = await this.authService.adminLogin(body.email, body.password);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    return { user: result.user, accessToken: result.accessToken };
  }
}
