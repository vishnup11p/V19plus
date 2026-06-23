import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let token = request.cookies?.['accessToken'];
    if (!token && request.headers.authorization?.startsWith('Bearer ')) {
      token = request.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'secret'
      });
      request.user = { id: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return true;
  }
}
