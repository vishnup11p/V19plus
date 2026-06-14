'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
      toast.success('Simulated recovery email sent!');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-n-red/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-n-red/5 blur-[120px] pointer-events-none" />

      {/* Header Logo */}
      <div className="mb-8 relative z-10">
        <Link href="/">
          <img src="/logo.png" alt="V19+" className="h-12 object-contain" />
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#141414]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10">
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Forgot your password?</h2>
                <p className="text-sm text-gray-400">
                  Enter your email address and we\'ll send you a simulated link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-[#202020] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-n-red/60 transition-colors text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 disabled:opacity-50 shadow-lg shadow-orange-500/25"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 scale-110">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Reset link sent!</h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                  We have sent a recovery email to <span className="text-white font-medium">{email}</span>. Click the link inside to set a new password.
                </p>
              </div>

              <div className="pt-4 space-y-4">
                <button
                  onClick={() => setSent(false)}
                  className="w-full py-3 bg-[#202020] hover:bg-[#252525] border border-white/5 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Resend Link
                </button>
                <Link
                  href="/login"
                  className="block w-full py-3 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-orange-500/10"
                >
                  Return to Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
