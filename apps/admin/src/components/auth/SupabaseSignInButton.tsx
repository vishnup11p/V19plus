'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../../utils/supabase';
import { useAdminAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export function SupabaseSignInButton() {
  const { supabaseLogin } = useAdminAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.access_token) {
          setLoading(true);
          try {
            await supabaseLogin(session.access_token);
            toast.success('Admin authenticated successfully! 🔑');
            router.push('/');
          } catch (err: any) {
            const msg = err?.response?.data?.message || 'Admin authentication failed. Access Denied.';
            toast.error(msg);
            await supabase.auth.signOut().catch(() => {});
          } finally {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseLogin, router]);

  const handleSupabaseSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'Supabase OAuth initialization failed');
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <motion.button
        type="button"
        onClick={handleSupabaseSignIn}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="w-full flex items-center justify-center gap-3 py-3 px-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 shadow-md shadow-black/30 hover:shadow-lg hover:shadow-red-950/20"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Signing in with Supabase…
          </>
        ) : (
          <>
            <SupabaseIcon />
            Continue with Supabase (Google)
          </>
        )}
      </motion.button>
    </div>
  );
}

function SupabaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M72.24 6.72c-2.48-5.36-9.76-5.84-12.88-1.04L4.88 77.2C2.08 81.36 5.04 87.2 10.08 87.2h44.48l-9.04 34.08c-2.48 5.36 9.76 5.84 12.88 1.04l54.48-71.52c2.8-4.16-.16-10-5.2-10H63.2l9.04-34.08z" fill="#EF4444"/>
    </svg>
  );
}
