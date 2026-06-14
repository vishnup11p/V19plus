'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CreditCard, ShieldCheck, Play, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signupStore = useAuthStore((s) => s.signup);

  // Wizard Steps: 1 = Create Account, 2 = Choose Plan, 3 = Payment Setup
  const [step, setStep] = useState(1);
  
  // Form values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('PREMIUM');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardZip, setCardZip] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  // Load params from Landing page redirects
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);

    const planParam = searchParams.get('plan');
    if (planParam) setSelectedPlan(planParam.toUpperCase());
  }, [searchParams]);

  // Credit Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    const formatted = val.slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    let formatted = val.slice(0, 4);
    if (formatted.length > 2) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
    }
    setCardExpiry(formatted);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCardCvv(val.slice(0, 3));
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        toast.error('All details are required');
        return;
      }
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length !== 16 || !cardExpiry || cardCvv.length !== 3 || !cardZip) {
      toast.error('Please enter valid credit card details');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Fire registration request
      await signupStore(email, password, name);
      toast.success('Account created and plan activated! Welcome to V19+ 🎉');
      
      // 2. Redirect to Profile selection
      router.replace('/profile/select');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to complete signup';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const PLANS = [
    { id: 'BASIC', name: 'Basic', price: '₹199', quality: '1080p', screens: 1, perks: ['Stream thousands of titles', 'Watch on phone & tablet', '1 Active screen'] },
    { id: 'STANDARD', name: 'Standard', price: '₹499', quality: '1080p', screens: 2, perks: ['Stream in Full HD', '2 Active screens at once', 'Offline downloads'] },
    { id: 'PREMIUM', name: 'Premium', price: '₹799', quality: '4K + HDR', screens: 4, perks: ['Stream in 4K Ultra HD + HDR', '4 Active screens at once', 'Dolby Atmos spatial sound', 'Offline downloads'] }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-n-red/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-n-red/5 blur-[120px] pointer-events-none" />

      {/* Header Logo */}
      <div className="mb-8 relative z-10">
        <Link href="/">
          <img src="/logo.png" alt="V19+" className="h-12 object-contain" />
        </Link>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="w-full max-w-lg mb-8 relative z-10">
        <div className="flex justify-between text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
          <span className={step >= 1 ? 'text-n-red' : ''}>1. Create Account</span>
          <span className={step >= 2 ? 'text-n-red' : ''}>2. Choose Plan</span>
          <span className={step >= 3 ? 'text-n-red' : ''}>3. Payment Setup</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-n-red" 
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Glass Card Form Container */}
      <div className="w-full max-w-xl bg-[#141414]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-white">Create a password to start your membership</h2>
                <p className="text-sm text-gray-400 mt-1">Just a few more steps and you\'re done!</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-[#202020] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-n-red/60 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 bg-[#202020] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-n-red/60 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Choose Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-3 bg-[#202020] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-n-red/60 transition-colors text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-4 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-white">Select the plan that fits you best</h2>
                <p className="text-sm text-gray-400 mt-1">Change or downgrade your membership at any time.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`cursor-pointer rounded-2xl border p-4 flex justify-between items-center transition-all ${
                        isSelected 
                          ? 'border-n-red bg-n-red/10 shadow-lg shadow-orange-500/5' 
                          : 'border-white/5 bg-[#181818] hover:border-white/15'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{plan.name}</span>
                          <span className="text-2xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 font-semibold uppercase">{plan.quality}</span>
                        </div>
                        <p className="text-xs text-gray-400 max-w-md line-clamp-1">{plan.perks.slice(0, 2).join(' · ')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-white">{plan.price}</span>
                        <p className="text-[10px] text-gray-500">/month</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-[2] py-4 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98"
                >
                  Confirm Plan
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-n-red">
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Simulated Checkout</span>
                </div>
                <h2 className="text-2xl font-black text-white">Set up credit or debit card payment</h2>
                <p className="text-sm text-gray-400">Secure simulated transacting via sandbox routing.</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4111 2222 3333 4444"
                      className="w-full pl-4 pr-12 py-3 bg-[#202020] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-n-red/60 transition-colors text-sm font-mono tracking-wider"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs select-none">VISA</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Expiration Date</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 bg-[#202020] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-n-red/60 transition-colors text-sm font-mono tracking-wider text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">CVV</label>
                    <input
                      type="password"
                      required
                      value={cardCvv}
                      onChange={handleCvvChange}
                      placeholder="123"
                      className="w-full px-4 py-3 bg-[#202020] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-n-red/60 transition-colors text-sm font-mono tracking-wider text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Billing Zip Code</label>
                  <input
                    type="text"
                    required
                    value={cardZip}
                    onChange={(e) => setCardZip(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="110001"
                    className="w-full px-4 py-3 bg-[#202020] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-n-red/60 transition-colors text-sm"
                  />
                </div>

                {/* Plan breakdown invoice snippet */}
                <div className="bg-[#181818] rounded-xl p-4 border border-white/5 space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>V19+ {PLANS.find(p => p.id === selectedPlan)?.name} membership</span>
                    <span>{PLANS.find(p => p.id === selectedPlan)?.price}/mo</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-white/5">
                    <span>Amount due today</span>
                    <span>{PLANS.find(p => p.id === selectedPlan)?.price}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={submitting}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 disabled:opacity-50 shadow-lg shadow-orange-500/25"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Paying...
                      </span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Finish Membership
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 text-xs text-gray-500 flex items-center gap-1.5 relative z-10">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Fully encrypted sandbox test checkout. No real funds charged.</span>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <SignupContent />
    </Suspense>
  );
}
