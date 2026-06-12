import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware: redirect unauthenticated users to /login
 * Netflix-style: the login/welcome screen is the first thing you see.
 * 
 * We check for the presence of a refreshToken cookie.
 * If it doesn't exist and the user is trying to access the home page,
 * we redirect them to /login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicPaths = ['/login', '/register', '/forgot-password'];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
  const isApiRoute = pathname.startsWith('/api');
  const isStaticAsset = pathname.startsWith('/_next') || pathname.includes('.');

  // Skip middleware for public paths, API routes, and static assets
  if (isPublicPath || isApiRoute || isStaticAsset) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const refreshToken = request.cookies.get('refreshToken');

  // If not authenticated and hitting the home page, redirect to login
  if (!refreshToken && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
