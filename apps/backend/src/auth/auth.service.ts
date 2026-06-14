import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type AuthUser = { id: string; email: string; name: string; role: string };

const ACCESS_SECRET = () =>
  process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_in_production';
const REFRESH_SECRET = () =>
  process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production';

@Injectable()
export class AuthService {
  private supabaseClient: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://zwkrncxrxwyvpchfrvdr.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
  }



  // ─── Email/password auth ─────────────────────────────────────────────────

  async signup(email: string, rawPassword: string, name: string) {
    if (!email || !rawPassword || !name) {
      throw new BadRequestException('Email, password and name are required');
    }
    const emailLower = email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      throw new BadRequestException('An account with this email already exists');
    }

    const hash = await bcrypt.hash(rawPassword, 12);

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email: emailLower,
        passwordHash: hash,
        name: name.trim(),
        isVerified: false,
        role: 'USER',
        profiles: {
          create: { name: name.trim().split(' ')[0] || 'Me', avatarColor: '#FF6B1A' },
        },
        subscription: {
          create: {
            plan: 'PREMIUM',
            status: 'TRIALING',
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
          },
        },
      },
    });

    return this.issueTokens(user);
  }

  async login(email: string, rawPassword: string) {
    if (!email || !rawPassword) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { subscription: true },
    });

    if (!user || !user.passwordHash) {
      // Constant-time compare to prevent user enumeration
      await bcrypt.compare(rawPassword, '$2a$12$invalidhashplaceholdertomatchtime');
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(rawPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user);
  }

  async adminLogin(email: string, rawPassword: string) {
    if (!email || !rawPassword) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user || user.role !== 'ADMIN' || !user.passwordHash) {
      await bcrypt.compare(rawPassword, '$2a$12$invalidhashplaceholdertomatchtime');
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const valid = await bcrypt.compare(rawPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    return this.issueTokens(user);
  }

  // ─── Supabase auth ───────────────────────────────────────────────────────

  async supabaseAuth(token: string) {
    if (!token) {
      throw new BadRequestException('Supabase token is required');
    }

    let supabaseUser: any;
    try {
      const { data, error } = await this.supabaseClient.auth.getUser(token);
      if (error || !data?.user) {
        throw new UnauthorizedException('Supabase session verification failed');
      }
      supabaseUser = data.user;
    } catch {
      throw new UnauthorizedException('Supabase session verification failed');
    }

    if (!supabaseUser.email) {
      throw new UnauthorizedException('Invalid Supabase token payload: missing email');
    }

    const user = await this.upsertSupabaseUser({
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
      picture: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
    });

    return this.issueTokens(user);
  }

  // ─── Token management ────────────────────────────────────────────────────

  async refresh(refreshTokenValue: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshTokenValue, { secret: REFRESH_SECRET() });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: {
        user: { select: { id: true, email: true, role: true, name: true } },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found — please log in again');
    }
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.deleteMany({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Refresh token expired — please log in again');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.deleteMany({ where: { id: storedToken.id } });
    return this.issueTokens(storedToken.user);
  }

  async logout(refreshTokenValue: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshTokenValue } });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        subscription: {
          select: { plan: true, status: true, currentPeriodEnd: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User session invalid');
    }

    return user;
  }

  private async upsertSupabaseUser(payload: {
    id: string;
    email: string;
    name: string;
    picture?: string | null;
  }) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ supabaseId: payload.id }, { email: payload.email }],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        isVerified: true,
      },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          supabaseId: payload.id,
          isVerified: true,
          name: user.name || payload.name || payload.email.split('@')[0],
          avatarUrl: user.avatarUrl || payload.picture || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          isVerified: true,
        },
      });
    } else {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          supabaseId: payload.id,
          name: payload.name || payload.email.split('@')[0],
          avatarUrl: payload.picture || null,
          isVerified: true,
          role: 'USER',
          profiles: {
            create: {
              name: payload.name.trim().split(' ')[0] || 'Me',
              avatarColor: '#FF6B1A',
            },
          },
          subscription: {
            create: {
              plan: 'PREMIUM',
              status: 'TRIALING',
              currentPeriodStart: now,
              currentPeriodEnd: trialEnd,
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          isVerified: true,
        },
      });
    }

    return user;
  }

  private async issueTokens(user: AuthUser) {
    const payload = { userId: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: ACCESS_SECRET(),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: REFRESH_SECRET(),
      expiresIn: '7d',
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    // Clean up expired refresh tokens for this user (housekeeping)
    this.prisma.refreshToken
      .deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
      })
      .catch(() => {});

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        isVerified: true,
        subscription: {
          select: { plan: true, status: true, currentPeriodEnd: true },
        },
      },
    });

    return { user: fullUser!, accessToken, refreshToken };
  }
}
