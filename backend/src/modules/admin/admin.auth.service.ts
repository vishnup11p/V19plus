import bcrypt from 'bcryptjs';
import prisma from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';

async function issueTokens(user: { id: string; email: string; name: string; role: string }) {
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

export async function adminLogin(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true, email: true, name: true, role: true, passwordHash: true,
    },
  });

  if (!user || user.role !== 'ADMIN' || !user.passwordHash) {
    throw new AppError('Invalid admin credentials', 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid admin credentials', 401);

  return issueTokens(user);
}
