'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, Check, Tv, Download, Users, Volume2, Sparkles } from 'lucide-react';
import { HeroBanner } from '../../components/content/HeroBanner';
import { GenreBar } from '../../components/content/GenreBar';
import { ContentRow } from '../../components/content/ContentRow';
import {
  useFeatured, useTrending, useOriginals,
  useContinueWatching, useRecommended, useBrowse,
} from '../../hooks/useContent';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';

// FAQ Mock Data
const FAQS = [
  {
    q: 'What is V19Plus?',
    a: 'V19Plus is a premium OTT streaming platform offering thousands of award-winning movies, TV shows, documentaries, and exclusive V19Plus Originals. You can stream anytime, anywhere, in stunning 4K HDR with Dolby Atmos surround sound.'
  },
  {
    q: 'How much does V19Plus cost?',
    a: 'We offer plans tailored to your needs. Basic starts at ₹199/month, Standard is ₹499/month, and Premium is ₹799/month. There are no hidden fees, contract terms, or cancellation charges.'
  },
  {
    q: 'Where can I watch?',
    a: 'Stream instantly on your Smart TV, smartphone, tablet, laptop, or gaming console. You can also download your favorite shows to watch offline while traveling.'
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'V19Plus is completely flexible. You can cancel your subscription online in just two clicks via your Profile dashboard. There are no cancellation fees.'
  },
  {
    q: 'Is there a kids mode?',
    a: 'Yes! V19Plus includes a Kids profile option with age-appropriate content filters, customizable avatars, and optional PIN locks to ensure a safe viewing environment.'
  }
];

const getGreeting = (name?: string) => {
  const hr = new Date().getHours();
  const displayName = name ? name.split(' ')[0] : 'there';
  if (hr < 12) return `Good morning, ${displayName}! 🌅`;
  if (hr < 17) return `Good afternoon, ${displayName}! ☀️`;
  if (hr < 22) return `Good evening, ${displayName}! 🍿`;
  return `Good night, ${displayName}! 🌙`;
};

export default function HomePage() {
  const router = useRouter();
  const { data: featured, isLoading: featuredLoading } = useFeatured();
  const { data: trending, isLoading: trendingLoading } = useTrending();
  const { data: originals, isLoading: originalsLoading } = useOriginals();
  const { data: continueWatching, isLoading: continueLoading } = useContinueWatching();
  const { data: recommended, isLoading: recommendedLoading } = useRecommended();
  
  const { isAuthenticated, user } = useAuthStore();
  const activeGenre = useUiStore((s) => s.activeGenre);
  const { data: genreContent, isLoading: genreLoading } = useBrowse(undefined, activeGenre || undefined);

  const [emailInput, setEmailInput] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const heroContent = featured?.[0];

  const continueItems = continueWatching?.map((h) => ({
    content: h.content,
    progress: h.progress,
  }));

  const topRated = trending?.filter((c) => (c.imdbScore || 0) >= 8.0);

  // Handle email signup redirect
  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    router.push(`/signup?email=${encodeURIComponent(emailInput)}`);
  };

  // 1. Authenticated Browse Dashboard
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-n-bg animate-fade-in">
        {/* Hero Banner with Slideshow */}
        <HeroBanner contents={featured} isLoading={featuredLoading} />

        {/* Dynamic Personal Greeting Banner */}
        <div className="relative -mt-20 z-10 px-4 md:px-12 mb-6">
          <div className="bg-[#181818]/70 border border-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 shadow-2xl flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                {getGreeting(user?.name)}
              </h2>
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                We've curated a fresh selection of originals and trending titles for you today.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Curated Collection
            </div>
          </div>
        </div>

        {/* Genre filter */}
        <div className="relative z-10 mb-6">
          <GenreBar />
        </div>

        {/* Content rows */}
        {activeGenre && (
          <ContentRow
            title={`${activeGenre} Picks`}
            items={genreContent?.items}
            isLoading={genreLoading}
          />
        )}

        {continueItems && continueItems.length > 0 && (
          <ContentRow
            title="Continue Watching"
            historyItems={continueItems}
            isLoading={continueLoading}
          />
        )}

        <ContentRow
          title="Trending Now"
          items={trending}
          isLoading={trendingLoading}
          showRank
        />

        <ContentRow
          title="V19Plus Originals"
          items={originals}
          isLoading={originalsLoading}
        />

        <ContentRow
          title="Recommended For You"
          items={recommended}
          isLoading={recommendedLoading}
        />

        {topRated && topRated.length > 0 && (
          <ContentRow
            title="Award Winners"
            items={topRated}
            isLoading={trendingLoading}
          />
        )}

        {/* Extra rows from featured */}
        {featured && featured.length > 1 && (
          <ContentRow
            title="Featured Titles"
            items={featured.slice(1)}
            isLoading={featuredLoading}
          />
        )}
      </div>
    );
  }

  // 2. Unauthenticated Marketing Landing Page
  return (
    <div className="bg-n-bg min-h-screen overflow-x-hidden">
      {/* Dynamic Background Slideshow Hero Banner */}
      <div className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center">
        {/* Pass featured items for background slideshow if loaded, or use placeholder */}
        {featured && featured.length > 0 ? (
          <HeroBanner contents={featured.slice(0, 4)} isLoading={featuredLoading} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a00]/40 via-n-bg to-n-bg" />
        )}

        {/* Call to Action Overlay card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4 text-center mt-12 bg-black/40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-n-red/10 border border-n-red/25 text-n-red text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Introducing Watch Party & AI Recommendations
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-tight tracking-tight text-shadow">
              Unlimited movies, TV shows, and <span className="text-n-red">more.</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 text-shadow">
              Stream in 4K HDR. Cancel any time.
            </p>
            <p className="text-sm sm:text-base text-gray-300">
              Ready to watch? Enter your email to create or restart your membership.
            </p>

            {/* Email Form */}
            <form onSubmit={handleGetStarted} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto pt-2">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Email address"
                className="flex-1 px-5 py-4 bg-black/60 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-n-red/60 transition-colors backdrop-blur-md"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/25"
              >
                Get Started
                <Play className="w-4 h-4 fill-white" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Feature Blocks */}
      <section className="py-24 px-4 md:px-12 bg-gradient-to-b from-n-bg to-n-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-5xl font-black text-white">Why Choose V19Plus?</h2>
            <p className="text-n-muted text-base md:text-lg">Premium viewing features built for entertainment lovers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Tv, title: 'Watch on your TV', desc: 'Compatible with Smart TVs, Apple TV, Chromecast, PlayStation, Xbox, and more.' },
              { icon: Download, title: 'Download & Go', desc: 'Save your favorite titles offline on iOS, Android, or Windows and stream anywhere.' },
              { icon: Users, title: 'Watch Together', desc: 'Host real-time watch parties with synchronized playback and live chat overlay.' },
              { icon: Volume2, title: 'Immersive Sound', desc: 'Experience films with high-fidelity spatial audio and full Dolby Atmos support.' }
            ].map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="bg-[#181818]/60 border border-white/5 rounded-3xl p-6 backdrop-blur-sm hover:border-n-red/30 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-n-red/10 border border-n-red/20 flex items-center justify-center text-n-red mb-5 group-hover:scale-110 transition-transform">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section className="py-24 px-4 md:px-12 bg-n-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-5xl font-black text-white">Choose Your Plan</h2>
            <p className="text-n-muted">All plans include cancel-anytime freedom and ad-free experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Basic', price: '₹199', quality: '1080p', screens: 1, perks: ['HD Streaming', 'Watch on phone & tablet', 'Cancel anytime'] },
              { name: 'Standard', price: '₹499', quality: '1080p', screens: 2, perks: ['Full HD (1080p)', '2 Simultaneous screens', 'Downloads enabled', 'Cancel anytime'], popular: false },
              { name: 'Premium', price: '₹799', quality: '4K + HDR', screens: 4, perks: ['4K Ultra HD + HDR', 'Dolby Atmos audio', '4 Simultaneous screens', 'Downloads enabled', 'Cancel anytime'], popular: true }
            ].map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-3xl border p-6 ${
                  p.popular 
                    ? 'border-n-red bg-gradient-to-b from-n-red/10 to-[#121212] scale-[1.03] shadow-lg shadow-orange-500/10' 
                    : 'border-white/10 bg-[#121212]'
                }`}
              >
                {p.popular && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-n-red text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{p.price}</span>
                    <span className="text-n-muted">/month</span>
                  </div>
                </div>
                <div className="mb-5">
                  <span className="text-xs font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-white">
                    {p.quality}
                  </span>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {p.perks.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <Check className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => router.push(`/signup?plan=${p.name.toUpperCase()}`)}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                    p.popular ? 'bg-n-red text-white hover:bg-n-red-hover' : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  Choose {p.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-24 px-4 md:px-12 bg-gradient-to-b from-n-black to-n-bg">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-center text-white mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-[#181818]/80 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left text-white hover:bg-white/5 transition-colors font-bold text-base md:text-lg"
                  >
                    {faq.q}
                    <ChevronDown className={`w-5 h-5 text-n-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-6 text-sm md:text-base text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer pre-signup row */}
      <section className="py-16 text-center border-t border-white/5 bg-n-bg px-4">
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Join V19Plus Today</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white">Ready to stream? Enter your email to begin.</h3>
          <form onSubmit={handleGetStarted} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Email address"
              className="flex-1 px-5 py-4 bg-black/60 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-n-red/60 transition-colors"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
