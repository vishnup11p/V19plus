import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { normalizeGoogleClientId, isValidGoogleClientIdFormat } from './google-client.helper';

type AuthUser = { id: string; email: string; name: string; role: string };
type GoogleProfile = {
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  picture?: string;
};

const ACCESS_SECRET = () =>
  process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_in_production';
const REFRESH_SECRET = () =>
  process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── Google helpers ───────────────────────────────────────────────────────

  private getGoogleClient(): OAuth2Client {
    if (!this.googleClient) {
      const clientId = this.getGoogleClientId();
      const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/google/callback`;
      this.googleClient = new OAuth2Client(clientId, clientSecret, redirectUri);
    }
    return this.googleClient;
  }

  private getGoogleClientId(): string {
    return normalizeGoogleClientId(process.env.GOOGLE_CLIENT_ID || '');
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

  // ─── Google auth ─────────────────────────────────────────────────────────

  async googleAuth(credential: string) {
    const clientId = this.getGoogleClientId();
    if (!clientId) {
      throw new ServiceUnavailableException('Google sign-in is not configured on this server');
    }

    let payload: any;
    try {
      const ticket = await this.getGoogleClient().verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google sign-in verification failed');
    }

    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    const user = await this.upsertGoogleUser({
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      given_name: payload.given_name,
      picture: payload.picture,
    });

    return this.issueTokens(user);
  }

  async googleCallback(code: string) {
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
    if (!clientSecret) {
      throw new ServiceUnavailableException('GOOGLE_CLIENT_SECRET is not configured');
    }

    let tokens: any;
    try {
      const result = await this.getGoogleClient().getToken(code);
      tokens = result.tokens;
    } catch {
      throw new UnauthorizedException('Google OAuth token exchange failed');
    }

    if (!tokens.id_token) {
      throw new UnauthorizedException('Google did not return an ID token');
    }

    const clientId = this.getGoogleClientId();
    const ticket = await this.getGoogleClient().verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    const user = await this.upsertGoogleUser({
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      given_name: payload.given_name,
      picture: payload.picture,
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
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Refresh token expired — please log in again');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
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

  // ─── Google config helpers ────────────────────────────────────────────────

  getGoogleSignInUrl(): string {
    const clientId = this.getGoogleClientId();
    if (!clientId) {
      throw new ServiceUnavailableException('Google client ID not configured');
    }
    return this.getGoogleClient().generateAuthUrl({
      access_type: 'online',
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
    });
  }

  getGoogleConfigStatus() {
    const clientId = this.getGoogleClientId();
    const hasSecret = !!(process.env.GOOGLE_CLIENT_SECRET || '').trim();
    return {
      configured: !!clientId && isValidGoogleClientIdFormat(clientId),
      clientIdPreview: clientId ? `${clientId.slice(0, 12)}...` : null,
      hasClientSecret: hasSecret,
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/google/callback`,
      formatValid: isValidGoogleClientIdFormat(clientId),
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async upsertGoogleUser(payload: GoogleProfile) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: payload.sub }, { email: payload.email }],
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
          googleId: payload.sub,
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
          googleId: payload.sub,
          name: payload.name || payload.email.split('@')[0],
          avatarUrl: payload.picture || null,
          isVerified: true,
          role: 'USER',
          profiles: {
            create: {
              name: payload.given_name || 'Me',
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
