import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Skeleton } from '../ui/Skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

export function ProtectedRoute({ children, requireSubscription = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasActiveSubscription } = useAuthStore();
  const location = useLocation();

  const exemptPaths = ['/subscription', '/profile', '/settings', '/login'];
  const isExempt = exemptPaths.some((p) => location.pathname.startsWith(p));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ returnUrl: location.pathname }} replace />;
  }

  if (requireSubscription && !isExempt && !hasActiveSubscription()) {
    return <Navigate to="/subscription" replace />;
  }

  return <>{children}</>;
}
