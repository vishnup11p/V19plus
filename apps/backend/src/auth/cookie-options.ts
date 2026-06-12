import type { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export function getRefreshCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSiteEnv = process.env.COOKIE_SAME_SITE as CookieOptions['sameSite'];
  // Use lax when frontends proxy /api (Vercel rewrites). Use none for direct cross-origin API calls.
  const sameSite = sameSiteEnv || (isProduction ? 'lax' : 'lax');

  return {
    httpOnly: true,
    secure: isProduction || sameSite === 'none',
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

export function getClearCookieOptions(): Pick<CookieOptions, 'path' | 'sameSite' | 'secure'> {
  const { path, sameSite, secure } = getRefreshCookieOptions();
  return { path, sameSite, secure };
}
