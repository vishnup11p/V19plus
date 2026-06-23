import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async signup(email: string, passwordPlain: string, name?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: name || 'User',
        role: 'USER',
      },
    });

    return user;
  }

  async login(email: string, passwordPlain: string, deviceId: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'secret',
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '7d',
    });

    // Store refresh token in Redis for device management and global signout
    await this.redisService.set(`refresh_token:${user.id}:${deviceId}`, refreshToken, 60 * 60 * 24 * 7);

    return { user, accessToken, refreshToken };
  }

  async refresh(oldRefreshToken: string, deviceId: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      });
      
      const storedToken = await this.redisService.get(`refresh_token:${payload.sub}:${deviceId}`);
      if (!storedToken || storedToken !== oldRefreshToken) {
        throw new UnauthorizedException('Session revoked or invalid');
      }

      const newPayload = { sub: payload.sub, role: payload.role };
      const newAccessToken = this.jwtService.sign(newPayload, {
        secret: process.env.JWT_ACCESS_SECRET || 'secret',
        expiresIn: '15m',
      });
      
      return { accessToken: newAccessToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, deviceId: string) {
    await this.redisService.del(`refresh_token:${userId}:${deviceId}`);
  }

  setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  clearCookies(res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });
    if (!user) throw new UnauthorizedException('User not found');
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async validateGoogleUser(profile: { email: string; name: string; googleId: string; avatarUrl?: string }) {
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
          role: 'USER',
          isVerified: true,
        },
      });
    } else if (!user.googleId) {
      // Link the account if they originally signed up with password
      user = await this.prisma.user.update({
        where: { email: profile.email },
        data: { googleId: profile.googleId, avatarUrl: user.avatarUrl || profile.avatarUrl, isVerified: true },
      });
    }
    return user;
  }
}
