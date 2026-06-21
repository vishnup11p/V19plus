import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { subscriptionApi, Plan } from '../api/subscription';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function Subscription() {
  const [searchParams] = useSearchParams();
  const { fetchMe } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams.get('success')) {
      toast.success('🎉 Subscription activated! Welcome aboard.');
      fetchMe();
    }
  }, [searchParams, fetchMe]);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => (await subscriptionApi.getPlans()).data,
  });

  const { data: current } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => (await subscriptionApi.getCurrent()).data,
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) => subscriptionApi.checkout(plan),
    onSuccess: (res) => {
      if (res.data.url) window.location.href = res.data.url;
      else toast.success('Demo mode: subscription activated!');
    },
    onError: () => toast.error('Checkout failed. Please try again.'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionApi.cancel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      fetchMe();
      toast.success('Subscription cancelled');
    },
  });

  const PLAN_FEATURES = {
    BASIC: {
      quality: '1080p',
      screens: 1,
      perks: ['Full HD streaming', 'Mobile & tablet', 'Cancel anytime'],
    },
    STANDARD: {
      quality: '1080p',
      screens: 2,
      perks: ['Full HD streaming', '2 screens at once', 'Downloads', 'Cancel anytime'],
    },
    PREMIUM: {
      quality: '4K Ultra HD',
      screens: 4,
      perks: ['4K + HDR streaming', 'Dolby Atmos', '4 screens at once', 'Downloads', 'Cancel anytime'],
    },
  };

  return (
    <div className="min-h-screen bg-n-bg pt-24 pb-16 px-4 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-n-white mb-3">
            Unlimited movies, TV shows, and more
          </h1>
          <p className="text-n-muted text-lg">Watch anywhere. Cancel anytime.</p>
        </div>

        {/* Current subscription banner */}
        {current && (
          <div className="flex items-center justify-between bg-n-surface border border-n-red/30 rounded-2xl p-5 mb-10">
            <div>
              <p className="text-n-white font-semibold">
                Current plan: <span className="text-n-red">{current.plan}</span>
              </p>
              <p className="text-n-muted text-sm mt-0.5">
                Status: <span className={current.status === 'ACTIVE' ? 'text-emerald-400' : 'text-n-muted'}>{current.status}</span>
              </p>
            </div>
            {current.status === 'ACTIVE' && (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-sm text-n-muted border border-n-divider rounded-lg hover:border-red-500/60 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Plan'}
              </button>
            )}
          </div>
        )}

        {/* Plans grid */}
        {plansLoading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-n-surface border border-n-divider rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {plans?.map((plan: Plan) => {
              const isCurrent = current?.plan === plan.id;
              const isPremium = plan.id === 'PREMIUM';
              const featureData = PLAN_FEATURES[plan.id as keyof typeof PLAN_FEATURES];

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all ${
                    isPremium
                      ? 'border-n-red bg-gradient-to-b from-n-red/10 to-n-surface scale-[1.02] shadow-red-glow'
                      : 'border-n-divider bg-n-surface hover:border-n-muted/50'
                  }`}
                >
                  {/* Most popular badge */}
                  {isPremium && (
                    <div className="absolute top-0 left-0 right-0 text-center">
                      <span className="inline-block bg-n-red text-white text-xs font-bold uppercase tracking-widest px-4 py-1">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className={`p-6 flex flex-col flex-1 ${isPremium ? 'pt-10' : ''}`}>
                    {/* Plan name */}
                    <div className="mb-6">
                      <h3 className="text-xl font-black text-n-white mb-1">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-n-white">₹{plan.price}</span>
                        <span className="text-n-muted">/month</span>
                      </div>
                    </div>

                    {/* Quality badge */}
                    {featureData && (
                      <div className="mb-5">
                        <span className="text-sm font-bold text-n-white bg-n-raised border border-n-divider px-3 py-1.5 rounded-full">
                          {featureData.quality}
                        </span>
                      </div>
                    )}

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {(featureData?.perks || plan.features || []).map((f: string) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-n-text">
                          <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      onClick={() => checkoutMutation.mutate(plan.id)}
                      disabled={checkoutMutation.isPending || isCurrent}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                        isPremium
                          ? 'bg-n-red hover:bg-n-red-hover text-white'
                          : isCurrent
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40'
                            : 'bg-n-white hover:bg-n-white/80 text-black'
                      }`}
                    >
                      {isCurrent
                        ? '✓ Current Plan'
                        : checkoutMutation.isPending
                          ? 'Processing...'
                          : `Get ${plan.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reassurance */}
        <div className="mt-12 grid sm:grid-cols-3 gap-6 text-center text-sm">
          {[
            { icon: '📺', title: 'Watch anywhere', desc: 'On phone, tablet, laptop, or TV.' },
            { icon: '✋', title: 'Cancel anytime', desc: 'No lock-in. Cancel in 1 click.' },
            { icon: '🔄', title: 'Change plans', desc: 'Upgrade or downgrade at any time.' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{item.icon}</span>
              <p className="font-semibold text-n-white">{item.title}</p>
              <p className="text-n-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
