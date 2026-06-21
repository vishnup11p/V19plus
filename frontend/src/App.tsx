import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Topbar } from './components/layout/Topbar';
import { Footer } from './components/layout/Footer';
import { DetailModal } from './components/content/DetailModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { SiteConfig } from './components/layout/SiteConfig';
import { Home } from './pages/Home';
import { Browse } from './pages/Browse';
import { Watch } from './pages/Watch';
import { Search } from './pages/Search';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Subscription } from './pages/Subscription';
import { Login } from './pages/Login';
import { AdminLogin } from './pages/admin/AdminLogin';
import { TitleDetail } from './pages/TitleDetail';
import { PersonDetail } from './pages/PersonDetail';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminContent } from './pages/admin/AdminContent';
import { AdminUsers } from './pages/admin/AdminUsers';

const authRoutes = ['/login', '/admin/login'];
const fullscreenRoutes = ['/watch'];
const adminRoutes = ['/admin'];

export default function App() {
  const location = useLocation();
  const isAuthPage = authRoutes.some((r) => location.pathname.startsWith(r));
  const isFullscreen = fullscreenRoutes.some((r) => location.pathname.startsWith(r));
  const isAdminPage = adminRoutes.some((r) => location.pathname.startsWith(r)) && !location.pathname.startsWith('/admin/login');
  const showMainChrome = !isAuthPage && !isFullscreen && !isAdminPage;

  return (
    <div className="min-h-screen bg-n-bg">
      <SiteConfig />
      {showMainChrome && <Topbar />}
      <main className={showMainChrome ? 'pt-0' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/verify-email" element={<Navigate to="/login" replace />} />
          <Route path="/reset-password" element={<Navigate to="/login" replace />} />
          <Route path="/title/:slug" element={<TitleDetail />} />
          <Route path="/person/:name" element={<PersonDetail />} />
          <Route path="/watch/:slug" element={<ProtectedRoute><Watch /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute requireSubscription={false}><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requireSubscription={false}><Settings /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute requireSubscription={false}><Subscription /></ProtectedRoute>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </main>
      {showMainChrome && <Footer />}
      {!isAdminPage && <DetailModal />}
    </div>
  );
}
