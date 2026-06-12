import { Request, Response } from 'express';
import * as adminAuthService from './admin.auth.service';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  const result = await adminAuthService.adminLogin(email, password);
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ user: result.user, accessToken: result.accessToken });
}
