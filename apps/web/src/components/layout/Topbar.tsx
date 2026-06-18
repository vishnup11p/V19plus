import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Movies' },
  { to: '/browse?type=SERIES', label: 'TV Shows' },
  { to: '/browse?type=DOCUMENTARY', label: 'Documentaries' },
];

export function Topbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { data: settings } = useSiteSettings();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const siteName = settings?.siteName || 'V19Plus';

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
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path.split('?')[0]);

  const isSelectPage = pathname === '/profile/select';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-n-bg shadow-lg shadow-black/30' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 h-16 md:h-[68px]">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          {/* Mobile menu toggle */}
          {!isSelectPage && (
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
          <Link href="/" className="flex-shrink-0">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={siteName} className="h-12 md:h-14 object-contain transition-transform hover:scale-105 duration-300" />
            ) : (
              <img src="/logo.png" alt={siteName} className="h-12 md:h-14 object-contain transition-transform hover:scale-105 duration-300" />
            )}
          </Link>

          {/* Desktop nav */}
          {!isSelectPage && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  href={link.to}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'text-n-white'
                      : 'text-n-muted hover:text-n-text'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  href="/watchlist"
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isActive('/watchlist')
                      ? 'text-n-white'
                      : 'text-n-muted hover:text-n-text'
                  }`}
                >
                  My List
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Right controls */}
        {!isSelectPage && (
          <div className="flex items-center gap-3 md:gap-4">
            {/* Search */}
            <button
              onClick={() => router.push('/search')}
              className="w-9 h-9 flex items-center justify-center text-n-muted hover:text-n-white transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {isAuthenticated ? (
              /* Profile dropdown */
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 group"
                  aria-label="Account"
                >
                  <div className="w-8 h-8 rounded overflow-hidden bg-n-red flex items-center justify-center text-white text-xs font-bold flex-shrink-0 animate-scale-in">
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
                        <p className="text-sm font-medium text-n-white truncate">{user?.name}</p>
                        <p className="text-xs text-n-muted truncate">{user?.email}</p>
                      </div>
                      {/* Links */}
                      <div className="py-1">
                        {[
                          { to: '/profile/select', icon: '👥', label: 'Switch Profiles' },
                          { to: '/profile', icon: '👤', label: 'Profile' },
                          { to: '/settings', icon: '⚙️', label: 'Account Settings' },
                          { to: '/subscription', icon: '⭐', label: 'Subscription' },
                        ].map((item) => (
                          <Link
                            key={item.to}
                            href={item.to}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-n-text hover:bg-n-surface transition-colors"
                          >
                            <span className="w-5 text-center">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                        {user?.role === 'ADMIN' && (
                          <Link
                            href="/admin"
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
                          onClick={() => { setProfileOpen(false); logout(); router.push('/login'); }}
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
                href="/login"
                className="px-4 py-2 bg-n-red hover:bg-n-red-hover text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && !isSelectPage && (
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
                  href={link.to}
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
