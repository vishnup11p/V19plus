import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { notificationApi, Notification } from '../../api/notifications';

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Movies' },
  { to: '/browse?type=SERIES', label: 'TV Shows' },
  { to: '/browse?type=DOCUMENTARY', label: 'Documentaries' },
];

export function Topbar() {
  const { isAuthenticated, user, logout, activeProfile, setActiveProfile } = useAuthStore();
  const { data: settings } = useSiteSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const siteName = settings?.siteName || 'V19+';
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => (await notificationApi.unreadCount()).data,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await notificationApi.list()).data,
    enabled: isAuthenticated && notifOpen,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path.split('?')[0]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-n-bg shadow-lg shadow-black/30' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
      }`}
    >
      {/* Simulated mobile status bar */}
      <div className="flex md:hidden justify-between items-center px-6 pt-2 pb-1 text-2xs text-[#FAF6EF]/80 font-bold tracking-tight bg-black/30 backdrop-blur-sm select-none">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <span>••••</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 md:px-12 h-16 md:h-[68px]">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          {/* Mobile menu toggle */}
          {isAuthenticated && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-n-text p-1"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          )}

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src="/logo.png" alt={siteName} className="h-8 md:h-10 object-contain" />
          </Link>

          {/* Desktop nav */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative py-5 text-sm font-semibold transition-colors duration-200 ${
                    isActive(link.to)
                      ? 'text-[#FAF6EF]'
                      : 'text-[#8C8478] hover:text-[#FAF6EF]'
                  }`}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF5C00]"
                      style={{ boxShadow: '0 0 8px #FF5C00' }}
                    />
                  )}
                </Link>
              ))}
              <Link
                to="/subscription"
                className={`relative py-5 text-sm font-semibold transition-colors duration-200 ${
                  isActive('/subscription')
                    ? 'text-[#FAF6EF]'
                    : 'text-[#8C8478] hover:text-[#FAF6EF]'
                }`}
              >
                My List
                {isActive('/subscription') && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF5C00]"
                    style={{ boxShadow: '0 0 8px #FF5C00' }}
                  />
                )}
              </Link>
            </nav>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 md:gap-4">
          {isAuthenticated && (
            <button
              onClick={() => navigate('/search')}
              className="w-9 h-9 flex items-center justify-center text-n-muted hover:text-n-white transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}

          {/* T1-7: Notification bell */}
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-9 h-9 flex items-center justify-center text-n-muted hover:text-n-white transition-colors relative"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {(unreadData?.count ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-n-red text-white text-2xs font-bold rounded-full flex items-center justify-center">
                    {unreadData!.count > 9 ? '9+' : unreadData!.count}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-3 w-80 bg-n-bg border border-n-divider rounded-xl shadow-netflix overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-n-divider">
                      <p className="font-bold text-n-white text-sm">Notifications</p>
                      {(unreadData?.count ?? 0) > 0 && (
                        <button
                          onClick={() => markAllMutation.mutate()}
                          className="text-2xs text-n-red hover:text-n-red-hover font-semibold transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-n-divider">
                      {!notifications || notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-3xl mb-2">🔔</p>
                          <p className="text-n-muted text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n: Notification) => (
                          <button
                            key={n.id}
                            onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-n-surface transition-colors ${
                              !n.isRead ? 'bg-n-surface/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {!n.isRead && <span className="w-1.5 h-1.5 bg-n-red rounded-full flex-shrink-0 mt-1.5" />}
                              <div className={!n.isRead ? '' : 'ml-3.5'}>
                                <p className="text-xs font-semibold text-n-white mb-0.5">{n.title}</p>
                                <p className="text-2xs text-n-muted leading-relaxed">{n.message}</p>
                                <p className="text-2xs text-n-muted/60 mt-1">
                                  {timeAgo(n.createdAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {isAuthenticated ? (
            /* Profile dropdown */
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 group"
                aria-label="Account"
              >
                <div className="w-8 h-8 rounded overflow-hidden bg-n-red flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <span>{user?.name?.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-n-muted transition-transform duration-200 hidden sm:block ${profileOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-3 w-56 bg-n-bg border border-n-divider rounded-lg shadow-netflix overflow-hidden"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-n-divider">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-n-white truncate flex-1">{user?.name}</p>
                        {activeProfile && (
                          <span
                            className="text-2xs px-2 py-0.5 rounded-full font-semibold text-white flex-shrink-0"
                            style={{ backgroundColor: activeProfile.avatarColor }}
                          >
                            {activeProfile.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-n-muted truncate">{user?.email}</p>
                    </div>
                    {/* Links */}
                    <div className="py-1">
                      {/* T1-1: Switch profile */}
                      <button
                        onClick={() => { setProfileOpen(false); setActiveProfile(null); navigate('/'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-n-text hover:bg-n-surface transition-colors"
                      >
                        <span className="w-5 text-center">🔄</span>
                        Switch Profile
                      </button>
                      {[
                        { to: '/profile', icon: '👤', label: 'Profile' },
                        { to: '/settings', icon: '⚙️', label: 'Account Settings' },
                        { to: '/subscription', icon: '⭐', label: 'Subscription' },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-n-text hover:bg-n-surface transition-colors"
                        >
                          <span className="w-5 text-center">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                      {user?.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-n-red hover:bg-n-surface transition-colors"
                        >
                          <span className="w-5 text-center">🛡️</span>
                          Admin Panel
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-n-divider py-1">
                      <button
                        onClick={() => { setProfileOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-n-muted hover:text-n-white hover:bg-n-surface transition-colors"
                      >
                        <span className="w-5 text-center">↩</span>
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-n-red hover:bg-n-red-hover text-white text-sm font-semibold rounded transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-n-bg border-t border-n-divider overflow-hidden"
          >
            <nav className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to) ? 'text-n-white bg-n-surface' : 'text-n-muted hover:text-n-text hover:bg-n-surface'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
