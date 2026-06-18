import prisma from '../../config/db';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { getGoogleClient, getGoogleClientId, getGoogleAuthUrl } from '../../config/google';
import { logger } from '../../utils/logger';

type AuthUser = { id: string; email: string; name: string; role: string; avatarUrl?: string | null; isVerified?: boolean };
type GoogleProfile = { sub: string; email: string; name?: string; given_name?: string; picture?: string };

async function issueTokens(user: AuthUser) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, email: true, name: true, role: true, avatarUrl: true,
      isVerified: true,
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
    },
  });

  return { user: fullUser!, accessToken, refreshToken };
}

async function upsertGoogleUser(payload: GoogleProfile) {
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
    select: {
      id: true, email: true, name: true, role: true, avatarUrl: true,
      isVerified: true, googleId: true,
    },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: payload.sub,
        isVerified: true,
        role: user.role,
        name: user.name || payload.name || payload.email.split('@')[0],
        avatarUrl: user.avatarUrl || payload.picture || null,
      },
      select: {
        id: true, email: true, name: true, role: true, avatarUrl: true,
        isVerified: true, googleId: true,
      },
    });
  } else {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    user = await prisma.user.create({
      data: {
        email: payload.email,
        googleId: payload.sub,
        name: payload.name || payload.email.split('@')[0],
        avatarUrl: payload.picture || null,
        isVerified: true,
        role: 'USER',
        profiles: { create: { name: payload.given_name || 'Me', avatarColor: '#FF6B1A' } },
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
        id: true, email: true, name: true, role: true, avatarUrl: true,
        isVerified: true, googleId: true,
      },
    });
  }

  return user;
}

export function getGoogleSignInUrl() {
  const clientId = getGoogleClientId();
  if (!clientId) throw new AppError('Google sign-in is not configured on server', 503);
  return getGoogleAuthUrl();
}

export async function googleOAuthCallback(code: string) {
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  if (!clientSecret) {
    throw new AppError('GOOGLE_CLIENT_SECRET is required for Google sign-in. Add it to backend/.env', 503);
  }

  let tokens;
  try {
    const result = await getGoogleClient().getToken(code);
    tokens = result.tokens;
  } catch (err) {
    logger.error('Google OAuth token exchange failed:', err);
    throw new AppError('Google sign-in failed. Check Client ID, Secret, and Redirect URI in Google Cloud Console.', 401);
  }

  if (!tokens.id_token) throw new AppError('Google did not return an ID token', 401);

  const clientId = getGoogleClientId();
  const ticket = await getGoogleClient().verifyIdToken({
    idToken: tokens.id_token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) throw new AppError('Invalid Google token payload', 401);

  const user = await upsertGoogleUser({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    given_name: payload.given_name,
    picture: payload.picture,
  });

  return issueTokens(user);
}

export async function googleAuth(credential: string) {
  const clientId = getGoogleClientId();
  if (!clientId) throw new AppError('Google sign-in is not configured on server', 503);

  let payload;
  try {
    const ticket = await getGoogleClient().verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (err) {
    logger.error('Google token verification failed:', err);
    throw new AppError('Google sign-in verification failed. Check GOOGLE_CLIENT_ID matches frontend.', 401);
  }

  if (!payload?.email || !payload.sub) {
    throw new AppError('Invalid Google token payload', 401);
  }

  const user = await upsertGoogleUser({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    given_name: payload.given_name,
    picture: payload.picture,
  });

  return issueTokens(user);
}

export async function refresh(refreshTokenValue: string) {
  verifyRefreshToken(refreshTokenValue);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
    include: { user: { select: { id: true, email: true, role: true, name: true } } },
  });

  if (!storedToken) throw new AppError('Invalid refresh token', 401);
  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError('Refresh token expired', 401);
  }

  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const user = storedToken.user;
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { token: newRefreshToken, userId: user.id, expiresAt },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshTokenValue: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshTokenValue } });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, role: true, avatarUrl: true,
      isVerified: true, createdAt: true,
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
    },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
}
