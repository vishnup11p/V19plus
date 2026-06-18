import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware: Protect authenticated routes and manage redirects.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasToken = request.cookies.has('refreshToken');

  // Protect private routes
  const protectedPaths = ['/profile', '/watch', '/settings', '/subscription'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect auth paths if already logged in
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isAuthPath && hasToken) {
    return NextResponse.redirect(new URL('/browse', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|api).*)'],
};
