import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware: Protect authenticated routes and manage redirects.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasToken = request.cookies.has('refreshToken');
  const hasProfile = request.cookies.has('v19_active_profile_id');

  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  const publicPaths = ['/legal'];
  const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Protect private routes
  const protectedPaths = [
    '/profile',
    '/watch',
    '/settings',
    '/subscription',
    '/browse',
    '/downloads',
    '/search',
    '/title',
    '/watchlist'
  ];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // 1. If logged in and trying to access login/signup, redirect to home
  // Removed this redirect to allow users with stale tokens to reach the login page and re-authenticate.
  // The login page itself will redirect fully authenticated users.
  // if (hasToken && isAuthPath) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  // 2. If not logged in, and path is protected, redirect to login
  if (!hasToken && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. If logged in, but has no active profile, and is not on exempt path, redirect to profile select
  const isProfileSelect = pathname === '/profile/select';
  const isSubscription = pathname === '/subscription';
  if (hasToken && !hasProfile && !isProfileSelect && !isSubscription && !isAuthPath && !isPublicPath) {
    return NextResponse.redirect(new URL('/profile/select', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|api).*)'],
};
