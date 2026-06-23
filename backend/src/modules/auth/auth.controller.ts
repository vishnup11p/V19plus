import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { getGoogleConfigStatus } from '../../config/google';
import * as authService from './auth.service';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'strict' | 'lax' | 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export async function googleStatus(_req: Request, res: Response) {
  res.json(getGoogleConfigStatus());
}

export async function googleAuthUrl(_req: Request, res: Response) {
  res.json({ url: authService.getGoogleSignInUrl() });
}

export async function googleCallback(req: Request, res: Response) {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  const code = req.query.code as string | undefined;
  const oauthError = req.query.error as string | undefined;

  if (oauthError) {
    res.redirect(`${frontend}/login?error=${encodeURIComponent(oauthError)}`);
    return;
  }
  if (!code) {
    res.redirect(`${frontend}/login?error=${encodeURIComponent('Missing authorization code')}`);
    return;
  }

  try {
    const result = await authService.googleOAuthCallback(code);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.redirect(`${frontend}/login?google=success`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Google sign-in failed';
    res.redirect(`${frontend}/login?error=${encodeURIComponent(msg)}`);
  }
}

export async function googleAuth(req: AuthRequest, res: Response) {
  const result = await authService.googleAuth(req.body.credential);
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ user: result.user, accessToken: result.accessToken });
}

export async function refresh(req: AuthRequest, res: Response) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ error: 'Refresh token required' });
    return;
  }
  const result = await authService.refresh(refreshToken);
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ accessToken: result.accessToken });
}

export async function logout(req: AuthRequest, res: Response) {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await authService.logout(refreshToken);
  }
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out successfully' });
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = await authService.getMe(req.user!.userId);
  res.json(user);
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body;
  const result = await authService.register(email, password, name);
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(201).json({ user: result.user, accessToken: result.accessToken });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.emailLogin(email, password);
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ user: result.user, accessToken: result.accessToken });
}
