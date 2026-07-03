'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, hasActiveSubscription } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // 1. If not authenticated, let middleware handle redirecting to /login
    if (!isAuthenticated) {
      setAuthorized(true);
      return;
    }

    const isProfileSelect = pathname === '/profile/select';
    const isSubscription = pathname === '/subscription';
    const isLegal = pathname.startsWith('/legal');

    // 2. Check profile selection
    const activeProfileStr = typeof window !== 'undefined' ? sessionStorage.getItem('v19_active_profile') : null;
    const hasProfile = !!activeProfileStr;

    // 3. Check active subscription
    const hasSub = hasActiveSubscription();

    // 4. Enforce gates
    if (!isProfileSelect && !isSubscription && !isLegal) {
      if (!hasProfile) {
        router.replace('/profile/select');
        return;
      }
      if (!hasSub) {
        router.replace('/subscription');
        return;
      }
    }

    setAuthorized(true);
  }, [isAuthenticated, isLoading, pathname, router, hasActiveSubscription]);

  if (isLoading || !authorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-white/5" />
          <div className="absolute inset-0 rounded-full border-4 border-n-red border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
