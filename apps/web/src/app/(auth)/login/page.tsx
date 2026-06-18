'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/browse');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-black bg-opacity-50">
      <div className="absolute inset-0 -z-10">
        <img
          src="https://assets.nflxext.com/ffe/siteui/vlv3/a73c4363-1dcd-4719-b3b1-3725418fd91d/fe1147dd-78be-44aa-a0e5-2d2994305a13/IN-en-20231016-popsignuptwoweeks-perspective_alpha_website_large.jpg"
          alt="background"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-black/60 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
      </div>

      <div className="flex-1 flex justify-center items-center px-4 py-16">
        <div className="w-full max-w-[450px] bg-black/75 rounded-md p-10 md:p-16">
          <h1 className="text-white text-3xl font-bold mb-7">Sign In</h1>
          
          {error && (
            <div className="bg-[#e87c03] text-white p-3 rounded text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#333] text-white rounded px-4 pt-5 pb-2 focus:outline-none focus:bg-[#454545] peer"
                placeholder=" "
              />
              <label className="absolute left-4 top-4 text-[#8c8c8c] text-base transition-all peer-focus:text-xs peer-focus:top-1.5 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base">
                Email address
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#333] text-white rounded px-4 pt-5 pb-2 focus:outline-none focus:bg-[#454545] peer"
                placeholder=" "
              />
              <label className="absolute left-4 top-4 text-[#8c8c8c] text-base transition-all peer-focus:text-xs peer-focus:top-1.5 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base">
                Password
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e50914] text-white rounded font-bold py-3 mt-4 hover:bg-[#c11119] transition disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="flex justify-between items-center text-[#b3b3b3] text-sm mt-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded bg-[#737373] border-none" />
                Remember me
              </label>
              <Link href="#" className="hover:underline">Need help?</Link>
            </div>
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center text-[#737373] text-sm">
              <div className="flex-1 border-t border-[#737373]"></div>
              <span className="px-3">OR</span>
              <div className="flex-1 border-t border-[#737373]"></div>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/google`}
              className="w-full bg-white text-black rounded font-bold py-3 flex items-center justify-center gap-3 hover:bg-gray-200 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </a>
          </div>

          <div className="mt-16 text-[#737373]">
            New to V19Plus?{' '}
            <Link href="/signup" className="text-white hover:underline">
              Sign up now.
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
