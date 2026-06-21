import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// Floating background particles
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 6,
  duration: Math.random() * 8 + 10,
}));

const FEATURES = [
  { icon: '🎬', label: 'Thousands of titles', sub: 'Movies, shows & originals' },
  { icon: '🎧', label: 'Dolby Atmos audio', sub: 'Immersive surround sound' },
  { icon: '📱', label: 'Watch anywhere', sub: 'Phone, tablet, TV or browser' },
];

export function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchMe, login, register } = useAuthStore();
  const handledRef = useRef(false);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (handledRef.current) return;
    const google = searchParams.get('google');
    const error = searchParams.get('error');

    if (error) {
      handledRef.current = true;
      const msg =
        error === 'invalid_client'
          ? 'Invalid Google OAuth client. Create a new Web application client in Google Cloud Console and update your .env files.'
          : decodeURIComponent(error);
      toast.error(msg, { duration: 6000 });
      setSearchParams({}, { replace: true });
      return;
    }

    if (google === 'success') {
      handledRef.current = true;
      fetchMe()
        .then((success) => {
          if (success) {
            toast.success('Welcome back! 🎉');
            const returnUrl =
              (history.state as { usr?: { returnUrl?: string } })?.usr?.returnUrl || '/';
            navigate(returnUrl, { replace: true });
          } else {
            toast.error('Sign-in succeeded but session could not be restored. Try again.');
            setSearchParams({}, { replace: true });
          }
        });
    }
  }, [searchParams, setSearchParams, fetchMe, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await register(email, password, name);
        toast.success('Successfully registered and logged in! 🎉');
      } else {
        await login(email, password);
        toast.success('Welcome back! 🎉');
      }
      const returnUrl = (history.state as { usr?: { returnUrl?: string } })?.usr?.returnUrl || '/';
      navigate(returnUrl, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-v-black overflow-hidden">
      {/* ── Left panel: brand art ── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] relative px-16 py-12 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a00] via-v-black to-[#0d0d0d]" />
        {/* Glowing orb */}
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-v-orange/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-v-orange/5 blur-[100px] pointer-events-none" />

        {/* Floating particles */}
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-v-orange/20 pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{ y: [0, -30, 0], opacity: [0.15, 0.5, 0.15] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <span className="text-3xl font-black tracking-tight">
              <span className="text-v-orange">V19</span>
              <span className="text-v-text">+</span>
            </span>
          </Link>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="text-5xl font-black leading-tight text-v-text">
              Your world of
              <br />
              <span className="text-v-orange">entertainment</span>
              <br />
              starts here.
            </h1>
            <p className="mt-5 text-lg text-v-muted max-w-sm leading-relaxed">
              Stream the stories that move you — award-winning films, binge-worthy shows, and
              exclusive originals.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl px-5 py-4 w-fit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
              >
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-v-text">{f.label}</p>
                  <p className="text-xs text-v-muted">{f.sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom note */}
        <motion.p
          className="relative z-10 text-xs text-v-muted/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Cancel any time. No commitments.
        </motion.p>
      </div>

      {/* ── Right panel: sign-in card ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle right panel background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-v-surface/40 to-v-black" />

        <motion.div
          className="relative w-full max-w-[420px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-1">
              <span className="text-3xl font-black">
                <span className="text-v-orange">V19</span>
                <span className="text-v-text">+</span>
              </span>
            </Link>
          </div>

          {/* Card */}
          <div className="bg-v-surface border border-v-divider/60 rounded-3xl p-8 shadow-2xl shadow-black/60 backdrop-blur-sm">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-v-text">
                {isSignUp ? 'Create your account 🚀' : 'Welcome back 👋'}
              </h2>
              <p className="text-v-muted mt-1.5 text-sm leading-relaxed">
                {isSignUp
                  ? 'Sign up to start streaming unlimited movies and TV shows.'
                  : 'Sign in to pick up where you left off.'}
              </p>
            </div>

            {/* Google sign-in */}
            <GoogleSignInButton />

            {/* Divider with label */}
            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-v-divider" />
              <span className="text-xs text-v-muted/70 font-medium">or continue with</span>
              <div className="h-px flex-1 bg-v-divider" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-v-text uppercase tracking-wider mb-2">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-v-black/50 border border-v-divider focus:border-v-orange rounded-xl px-4 py-3 text-v-text placeholder-v-muted/50 focus:outline-none transition-colors"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-v-text uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-v-black/50 border border-v-divider focus:border-v-orange rounded-xl px-4 py-3 text-v-text placeholder-v-muted/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-v-text uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-v-black/50 border border-v-divider focus:border-v-orange rounded-xl px-4 py-3 text-v-text placeholder-v-muted/50 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-v-orange hover:bg-v-orange/90 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-v-orange/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Toggle Sign In / Sign Up */}
            <p className="mt-6 text-center text-sm text-v-muted">
              {isSignUp ? 'Already have an account?' : 'New to V19+?'}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-v-orange hover:text-v-orange/80 transition-colors font-semibold"
              >
                {isSignUp ? 'Sign in now' : 'Sign up now'}
              </button>
            </p>

            {/* Footer links */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-v-divider/50" />
              </div>
              <p className="text-center text-sm text-v-muted">
                Just browsing?{' '}
                <Link
                  to="/"
                  className="text-v-orange hover:text-v-orange-light transition-colors font-medium underline underline-offset-4 decoration-v-orange/30 hover:decoration-v-orange"
                >
                  Explore without signing in
                </Link>
              </p>
            </div>
          </div>

          {/* Trust indicators */}
          <motion.div
            className="mt-6 flex items-center justify-center gap-6 text-xs text-v-muted/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-v-orange/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure sign-in
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-v-orange/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Privacy protected
            </span>
          </motion.div>

          {/* Terms */}
          <p className="mt-4 text-center text-[11px] text-v-muted/40 leading-relaxed">
            By signing in you agree to our{' '}
            <span className="hover:text-v-muted cursor-pointer transition-colors">Terms of Service</span>{' '}
            and{' '}
            <span className="hover:text-v-muted cursor-pointer transition-colors">Privacy Policy</span>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
