import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Skeleton } from '../ui/Skeleton';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-v-black">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
