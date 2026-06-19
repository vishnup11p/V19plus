'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../utils/supabase';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/browse';
  const { signup } = useAuthStore();

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }

    setLoading(true);
    setError('');
    try {
      await signup(email.trim(), password, name.trim());
      toast.success('Account created! Welcome to V19Plus 🎉');
      router.push(returnUrl);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 409) {
        setError('An account with this email already exists. Please sign in.');
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://v19plus-api.onrender.com/api';
  const googleHref = `${apiBase}/auth/google`;

  const handleGoogleSignIn = () => {
    const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
    if (isNative) {
      toast.error('Google Sign-In is not available in the mobile app. Please use email and password.', {
        duration: 6000,
      });
      return;
    }

    setGoogleLoading(true);
    window.location.href = googleHref;
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-black">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <img
          src="https://assets.nflxext.com/ffe/siteui/vlv3/a73c4363-1dcd-4719-b3b1-3725418fd91d/fe1147dd-78be-44aa-a0e5-2d2994305a13/IN-en-20231016-popsignuptwoweeks-perspective_alpha_website_large.jpg"
          alt="V19Plus background"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
      </div>

      {/* Header */}
      <header className="px-8 py-5">
        <Link href="/">
          <span className="text-[#E50914] font-black text-3xl tracking-tight select-none">V19PLUS</span>
        </Link>
      </header>

      <div className="flex-1 flex justify-center items-center px-4 py-8">
        <div className="w-full max-w-[450px] bg-black/80 backdrop-blur-sm rounded-lg p-10 md:p-12 border border-white/5">
          <h1 className="text-white text-3xl font-bold mb-8">Create Account</h1>

          {/* Error Banner */}
          {error && (
            <div className="bg-[#E50914]/10 border border-[#E50914]/30 text-white p-3.5 rounded-md text-sm mb-5 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-[#E50914] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Name */}
            <div className="relative">
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                className="w-full bg-[#2a2a2a] hover:bg-[#333] focus:bg-[#333] text-white rounded px-4 pt-6 pb-2 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all peer text-base"
                placeholder=" "
                autoComplete="name"
              />
              <label
                htmlFor="signup-name"
                className="absolute left-4 top-4 text-[#8c8c8c] text-base transition-all duration-150 peer-focus:text-xs peer-focus:top-1.5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:top-1.5 pointer-events-none"
              >
                Your Name
              </label>
            </div>

            {/* Email */}
            <div className="relative">
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full bg-[#2a2a2a] hover:bg-[#333] focus:bg-[#333] text-white rounded px-4 pt-6 pb-2 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all peer text-base"
                placeholder=" "
                autoComplete="email"
              />
              <label
                htmlFor="signup-email"
                className="absolute left-4 top-4 text-[#8c8c8c] text-base transition-all duration-150 peer-focus:text-xs peer-focus:top-1.5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:top-1.5 pointer-events-none"
              >
                Email address
              </label>
            </div>

            {/* Password */}
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-[#2a2a2a] hover:bg-[#333] focus:bg-[#333] text-white rounded px-4 pt-6 pb-2 pr-12 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all peer text-base"
                placeholder=" "
                autoComplete="new-password"
              />
              <label
                htmlFor="signup-password"
                className="absolute left-4 top-4 text-[#8c8c8c] text-base transition-all duration-150 peer-focus:text-xs peer-focus:top-1.5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:top-1.5 pointer-events-none"
              >
                Password (min. 8 characters)
              </label>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c8c] hover:text-white transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="flex gap-1 -mt-2">
                {[1,2,3,4].map((lvl) => (
                  <div
                    key={lvl}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      password.length >= lvl * 3
                        ? password.length >= 12 ? 'bg-green-500' : password.length >= 8 ? 'bg-yellow-500' : 'bg-red-500'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              id="signup-submit"
              disabled={loading || googleLoading}
              className="w-full bg-[#E50914] hover:bg-[#c11119] text-white rounded font-bold py-3.5 mt-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account…
                </>
              ) : 'Get Started'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3 text-[#737373] text-sm">
            <div className="flex-1 border-t border-[#737373]/50" />
            <span>OR</span>
            <div className="flex-1 border-t border-[#737373]/50" />
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            id="google-signup"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full bg-white hover:bg-gray-100 text-[#1f1f1f] rounded font-semibold py-3.5 flex items-center justify-center gap-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {googleLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting to Google…
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="mt-8 text-[#737373] text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:underline font-medium">
              Sign in.
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
