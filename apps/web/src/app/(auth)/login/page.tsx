'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleSignInButton } from '../../../components/auth/GoogleSignInButton';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';

// Floating background particles
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
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

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchMe, login, signup } = useAuthStore();
  const handledRef = useRef(false);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required');
      return;
    }
    if (isSignUp && !name.trim()) {
      toast.error('Name is required to sign up');
      return;
    }
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signup(email, password, name);
        toast.success('Registration successful! Welcome 🎉');
      } else {
        await login(email, password);
        toast.success('Signed in successfully! 👋');
      }
      router.replace('/');
    } catch (err: any) {
      const errMessage = err?.response?.data?.message || err?.message || 'Authentication failed';
      toast.error(Array.isArray(errMessage) ? errMessage[0] : errMessage);
    } finally {
      setSubmitting(false);
    }
  };

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
      router.replace('/login');
      return;
    }

    if (google === 'success') {
      handledRef.current = true;
      fetchMe()
        .then(() => {
          toast.success('Welcome back! 🎉');
          router.replace('/');
        })
        .catch(() => {
          toast.error('Sign-in succeeded but session could not be restored. Try again.');
          router.replace('/login');
        });
    }
  }, [searchParams, fetchMe, router]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0a0a] overflow-hidden">
      {/* ── Left panel: brand art (Desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] relative px-16 py-12 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a00] via-[#0a0a0a] to-[#0d0d0d]" />
        {/* Glowing orb */}
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-orange-500/5 blur-[100px] pointer-events-none" />

        {/* Floating particles */}
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-orange-500/20 pointer-events-none"
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
          <Link href="/" className="inline-flex items-center gap-2 group">
            <img src="/logo.png" alt="V19+" className="h-14 md:h-16 object-contain transition-transform hover:scale-105 duration-300" />
          </Link>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="text-5xl font-black leading-tight text-white">
              Your world of
              <br />
              <span className="text-orange-500">entertainment</span>
              <br />
              starts here.
            </h1>
            <p className="mt-5 text-lg text-gray-400 max-w-sm leading-relaxed">
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
                className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4 w-fit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
              >
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-gray-500">{f.sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom note */}
        <motion.p
          className="relative z-10 text-xs text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Cancel any time. No commitments.
        </motion.p>
      </div>

      {/* ── Mobile hero section ── */}
      <div className="lg:hidden relative flex flex-col items-center px-6 pt-16 pb-8 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a00] via-[#0a0a0a] to-[#0a0a0a]" />
        <motion.div
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-orange-500/15 blur-[100px] pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Particles on mobile too */}
        {PARTICLES.slice(0, 10).map((p) => (
          <motion.div
            key={`m-${p.id}`}
            className="absolute rounded-full bg-orange-500/25 pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Logo */}
        <motion.div
          className="relative z-10 mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src="/logo.png" alt="V19+" className="h-20 object-contain" />
        </motion.div>

        {/* Tagline */}
        <motion.h1
          className="relative z-10 text-2xl font-black text-center text-white leading-tight mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Unlimited movies,
          <br />
          shows & <span className="text-orange-500">more</span>
        </motion.h1>

        <motion.p
          className="relative z-10 text-sm text-gray-400 text-center mb-6 max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          Watch anywhere. Cancel anytime.
        </motion.p>

        {/* Feature pills - horizontal on mobile */}
        <motion.div
          className="relative z-10 flex gap-3 overflow-x-auto w-full pb-2 scrollbar-hide"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.label}
              variants={itemVariants}
              className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 flex-shrink-0"
            >
              <span className="text-lg">{f.icon}</span>
              <div>
                <p className="text-xs font-semibold text-white whitespace-nowrap">{f.label}</p>
                <p className="text-[10px] text-gray-500 whitespace-nowrap">{f.sub}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Sign-in card panel ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-8 lg:px-6 lg:py-12 relative">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-[#1a1a1a]/40 to-[#0a0a0a]" />

        <motion.div
          className="relative w-full max-w-[420px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
        >
          {/* Card */}
          <motion.div
            className="bg-[#1a1a1a]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-md"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {/* Header */}
            <motion.div
              className="mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {isSignUp ? 'Create account' : 'Sign In'}
              </h2>
            </motion.div>

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-[#252525] border border-white/10 rounded-xl text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-[#252525] border border-white/10 rounded-xl text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#252525] border border-white/10 rounded-xl text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 mt-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm transition-all active:scale-98 shadow-md shadow-orange-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </button>
            </form>

            {/* Toggle Sign In/Up */}
            <div className="text-center text-sm mb-6 text-gray-400">
              {isSignUp ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-orange-500 hover:text-orange-400 font-semibold focus:outline-none"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  New to V19+?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-orange-500 hover:text-orange-400 font-semibold focus:outline-none"
                  >
                    Sign Up now
                  </button>
                </p>
              )}
            </div>

            {/* Divider with label */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-2xs text-gray-500 font-semibold uppercase tracking-wider">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Google sign-in */}
            <div className="flex justify-center">
              <GoogleSignInButton />
            </div>

            {/* Footer links */}
            <motion.div
              className="mt-6 sm:mt-8 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <p className="text-center text-sm text-gray-400">
                Just browsing?{' '}
                <Link
                  href="/browse"
                  className="text-orange-500 hover:text-orange-400 transition-colors font-medium underline underline-offset-4 decoration-orange-500/30 hover:decoration-orange-500"
                >
                  Explore without signing in
                </Link>
              </p>
            </motion.div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="mt-5 sm:mt-6 flex items-center justify-center gap-5 sm:gap-6 text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-orange-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure sign-in
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-orange-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Privacy protected
            </span>
          </motion.div>

          {/* Terms */}
          <motion.p
            className="mt-3 sm:mt-4 text-center text-[11px] text-gray-600 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            By signing in you agree to our{' '}
            <span className="hover:text-gray-400 cursor-pointer transition-colors">Terms of Service</span>{' '}
            and{' '}
            <span className="hover:text-gray-400 cursor-pointer transition-colors">Privacy Policy</span>.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <LoginContent />
    </Suspense>
  );
}
