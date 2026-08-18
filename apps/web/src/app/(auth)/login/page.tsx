'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';

export default function LoginPage() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const returnUrl    = searchParams.get('returnUrl') || '/browse';
  const { login, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push(returnUrl);
    }
  }, [isAuthenticated, router, returnUrl]);

  const handleBiometricLogin = async () => {
    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.verifyIdentity({
        reason: 'Authenticate to access V19Plus',
        title: 'Biometric Sign In',
        subtitle: 'Use fingerprint/face scan to log in',
        description: 'Please scan your fingerprint or face to authenticate'
      });
      
      const creds = await NativeBiometric.getCredentials({ server: 'v19plus.app' });
      if (creds && creds.username && creds.password) {
        setLoading(true);
        setError('');
        await login(creds.username, creds.password);
        router.push(returnUrl);
      } else {
        setError('Failed to retrieve biometric credentials.');
      }
    } catch (err: any) {
      console.error('Biometric authentication failed:', err);
      if (err?.code !== 100 && err?.message !== 'User canceled') {
        setError('Biometric authentication failed. Please enter your password.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        
        const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
        const avail = await NativeBiometric.isAvailable();
        if (avail.isAvailable) {
          setBiometricAvailable(true);
          try {
            const creds = await NativeBiometric.getCredentials({ server: 'v19plus.app' });
            if (creds && creds.username) {
              setHasSavedCredentials(true);
              handleBiometricLogin();
            }
          } catch (e) {
            // No saved credentials
          }
        }
      } catch (e) {
        console.error('Biometric check failed:', e);
      }
    };
    checkBiometrics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Email / Password sign-in ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform() && biometricAvailable) {
        try {
          const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
          await NativeBiometric.setCredentials({
            username: email.trim(),
            password: password,
            server: 'v19plus.app',
          });
        } catch (e) {
          console.error('Failed to store biometric credentials:', e);
        }
      }

      router.push(returnUrl);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 400) {
        setError('Incorrect email or password. Please try again.');
      } else if (status === 404) {
        setError('No account found with this email. Please sign up.');
      } else {
        setError(err?.response?.data?.message || 'Sign-in failed. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Google OAuth — uses the backend Passport.js redirect ── */
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://v19plus-api.onrender.com/api';
  const googleHref = `${apiBase}/auth/google`;

  return (
    <div className="min-h-screen relative flex flex-col bg-black select-none">

      {/* ── Cinematic background ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src="https://assets.nflxext.com/ffe/siteui/vlv3/a73c4363-1dcd-4719-b3b1-3725418fd91d/fe1147dd-78be-44aa-a0e5-2d2994305a13/IN-en-20231016-popsignuptwoweeks-perspective_alpha_website_large.jpg"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-[0.35] scale-105"
        />
        {/* vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>

      {/* ── Top navigation ── */}
      <header className="relative z-10 flex items-center justify-between px-8 sm:px-16 pt-6 pb-4">
        <Link href="/" aria-label="V19Plus home">
          <span className="text-[#E50914] font-black text-4xl tracking-tight drop-shadow-lg">
            V19PLUS
          </span>
        </Link>
      </header>

      {/* ── Card ── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px] rounded-2xl bg-black/80 backdrop-blur-md border border-white/[0.06] shadow-2xl shadow-black/60 px-10 py-12">

          <h1 className="text-white text-[2rem] font-bold mb-2 tracking-tight">Sign In</h1>
          <p className="text-white/40 text-sm mb-8">Welcome back to V19Plus</p>

          {/* ── Error banner ── */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-lg bg-[#E50914]/10 border border-[#E50914]/25 px-4 py-3 text-sm text-white"
            >
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E50914]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email */}
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder=" "
                className="peer w-full rounded-md bg-[#2a2a2a] px-4 pb-2.5 pt-7 text-white text-[15px] placeholder-transparent focus:bg-[#333] focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
              />
              <label
                htmlFor="email"
                className="pointer-events-none absolute left-4 top-2 text-[10px] text-white/40 transition-all
                           peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-white/30
                           peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-white/50"
              >
                Email address
              </label>
            </div>

            {/* Password */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder=" "
                className="peer w-full rounded-md bg-[#2a2a2a] px-4 pb-2.5 pt-7 pr-11 text-white text-[15px] placeholder-transparent focus:bg-[#333] focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
              />
              <label
                htmlFor="password"
                className="pointer-events-none absolute left-4 top-2 text-[10px] text-white/40 transition-all
                           peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-white/30
                           peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-white/50"
              >
                Password
              </label>
              {/* Show / hide toggle */}
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/80 transition-colors"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="sign-in-btn"
              disabled={loading}
              className="mt-2 w-full rounded-md bg-[#E50914] py-3.5 text-[15px] font-bold text-white transition-all hover:bg-[#c11119] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing In…
                </>
              ) : 'Sign In'}
            </button>

            {/* Biometric login */}
            {biometricAvailable && hasSavedCredentials && (
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={loading}
                className="w-full mt-3 rounded-md border border-white/20 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-white/5 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a13.916 13.916 0 00-2.81-8.31l-.054-.09z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11c0 3.517 1.009 6.799 2.753 9.571m-3.44-2.04l.054.09z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                Sign In with Biometrics
              </button>
            )}

            <div className="flex items-center justify-between text-sm text-white/40">
              <label className="flex cursor-pointer items-center gap-2 hover:text-white/60 transition-colors">
                <input type="checkbox" className="h-3.5 w-3.5 accent-[#E50914] rounded" />
                Remember me
              </label>
              <Link href="#" className="hover:text-white/70 hover:underline transition-colors">Need help?</Link>
            </div>
          </form>

          {/* ── Divider ── */}
          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/30 uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* ── Google OAuth ── */}
          <a
            href={googleHref}
            id="google-login-btn"
            className="flex w-full items-center justify-center gap-3 rounded-md bg-white py-3.5 text-[15px] font-semibold text-[#1f1f1f] shadow-sm transition-all hover:bg-gray-100 active:scale-[0.98]"
          >
            {/* Google "G" logo */}
            <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>

          {/* ── Footer ── */}
          <p className="mt-10 text-sm text-white/30">
            New to V19Plus?{' '}
            <Link href="/signup" className="font-medium text-white/70 hover:text-white hover:underline transition-colors">
              Sign up now.
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
