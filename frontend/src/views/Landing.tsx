import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_ITEMS = [
  {
    q: 'What is V19+?',
    a: 'V19+ is a premium streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more on thousands of internet-connected devices. You can watch as much as you want, whenever you want – all for one low monthly price.',
  },
  {
    q: 'How much does V19+ cost?',
    a: 'Watch V19+ on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee. Plans range from $5.99 to $19.99 a month. No extra costs, no contracts.',
  },
  {
    q: 'Where can I watch?',
    a: 'Watch anywhere, anytime. Sign in with your V19+ account to watch instantly on the web at v19plus.com from your personal computer or on any internet-connected device, including smart TVs, smartphones, tablets, streaming media players and game consoles.',
  },
  {
    q: 'How do I cancel?',
    a: 'V19+ is flexible. There are no annoying contracts and no commitments. You can easily cancel your account online in two clicks. There are no cancellation fees – start or stop your account anytime.',
  },
  {
    q: 'What can I watch on V19+?',
    a: 'V19+ has an extensive library of feature films, documentaries, TV shows, anime, award-winning originals, and more. Watch as much as you want, anytime you want.',
  },
  {
    q: 'Is V19+ good for kids?',
    a: 'The V19+ Kids experience is included in your membership to give parents control while kids enjoy family-friendly TV shows and films in their own space. Kids profiles feature PIN-protected parental controls that let you restrict the maturity rating of content kids can watch.',
  },
];

export function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      navigate(`/login?email=${encodeURIComponent(email)}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="text-n-white bg-n-black">
      {/* ── HERO SECTION ── */}
      <section className="relative h-[80vh] md:h-[95vh] w-full flex items-center justify-center border-b-[8px] border-n-divider overflow-hidden">
        {/* Background perspective collage */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
          style={{ 
            backgroundImage: `url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcca-e111405d741a/assets/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg')`
          }}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-n-black via-n-black/75 to-black/85" />
        <div className="absolute inset-0 bg-radial-vignette opacity-90" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center mt-12 md:mt-20">
          <motion.h1 
            className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-n-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Unlimited movies,
            <br />
            TV shows, and more
          </motion.h1>
          <motion.p 
            className="text-base sm:text-xl md:text-2xl mt-4 md:mt-6 text-n-text font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Watch anywhere. Cancel anytime.
          </motion.p>
          <motion.p 
            className="text-sm sm:text-lg md:text-xl mt-6 md:mt-8 text-n-text/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Ready to watch? Enter your email to create or restart your membership.
          </motion.p>

          {/* Email CTA */}
          <motion.form 
            onSubmit={handleGetStarted}
            className="mt-6 md:mt-8 flex flex-col md:flex-row items-center justify-center gap-3 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <div className="relative w-full md:flex-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-5 py-4 bg-black/60 border border-n-muted/50 rounded-md text-n-white text-base focus:outline-none focus:border-n-white focus:ring-1 focus:ring-n-white transition-all placeholder:text-n-muted/80 peer"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-4 bg-n-red hover:bg-n-red-hover text-white text-lg font-bold rounded-md flex items-center justify-center gap-2 transition-colors active:bg-n-red-dark group shadow-lg hover:shadow-n-red/20"
            >
              Get Started
              <svg 
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.form>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      {/* Feature 1: Enjoy on TV */}
      <section className="py-14 md:py-24 border-b-[8px] border-n-divider px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-n-white">
              Enjoy on your TV
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-n-text leading-relaxed font-medium">
              Watch on smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players and more.
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            {/* TV Mockup */}
            <div className="relative w-full max-w-[460px] aspect-[4/3] bg-gradient-to-tr from-n-surface to-n-bg border-4 border-n-divider rounded-[2rem] p-4 shadow-2xl flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-cover bg-center bg-[#0d0d0d] opacity-90 transition-transform duration-700 group-hover:scale-105" 
                   style={{ backgroundImage: `url('https://images.unsplash.com/photo-1593789198777-f29bc259780e?q=80&w=600&auto=format&fit=crop')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              {/* Play symbol */}
              <div className="relative z-10 w-16 h-16 rounded-full bg-n-red/90 flex items-center justify-center text-white shadow-red-glow scale-90 group-hover:scale-100 transition-transform">
                <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-n-text/80 font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                <span>Stranger Things</span>
                <span className="text-n-red animate-pulse">● LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Download offline */}
      <section className="py-14 md:py-24 border-b-[8px] border-n-divider px-6">
        <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1 flex justify-center">
            {/* Phone Mockup with Download Card */}
            <div className="relative w-full max-w-[270px] aspect-[9/18] bg-n-bg border-[6px] border-n-divider rounded-[3rem] p-3 shadow-2xl flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute inset-0 bg-cover bg-center"
                   style={{ backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop')` }} />
              <div className="absolute inset-0 bg-black/40" />

              {/* Status bar */}
              <div className="relative z-10 flex justify-between px-2 text-[10px] text-white/80 font-bold">
                <span>9:41</span>
                <div className="flex gap-1.5">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* Downloading overlay card */}
              <div className="relative z-10 w-full bg-black border border-n-divider/80 rounded-2xl p-3 flex items-center gap-3 shadow-2xl mb-4">
                <div className="w-10 h-14 bg-n-surface rounded overflow-hidden flex-shrink-0">
                  <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=100&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-n-white truncate">Bridgerton</p>
                  <p className="text-[10px] text-v-orange font-semibold">Downloading...</p>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-n-muted/30 flex items-center justify-center relative flex-shrink-0">
                  <div className="w-5 h-5 rounded-full border-t-2 border-n-red animate-spin" />
                  <span className="absolute text-[8px] font-bold text-n-white">74%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-n-white">
              Download your shows to watch offline
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-n-text leading-relaxed font-medium">
              Save your favorites easily and always have something to watch.
            </p>
          </div>
        </div>
      </section>

      {/* Feature 3: Watch Everywhere */}
      <section className="py-14 md:py-24 border-b-[8px] border-n-divider px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-n-white">
              Watch everywhere
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-n-text leading-relaxed font-medium">
              Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            {/* Tablet Mockup */}
            <div className="relative w-full max-w-[420px] aspect-[16/10] bg-n-bg border-[10px] border-n-divider rounded-[2rem] p-1 shadow-2xl flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-cover bg-center"
                   style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542204172-e7052809a86e?q=80&w=600&auto=format&fit=crop')` }} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
              {/* Media Controls Overlay */}
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-xs text-white/90 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <button className="w-5 h-5 flex items-center justify-center bg-white text-black rounded-full">▶</button>
                  <span className="font-bold">Wednesday · S1 E1</span>
                </div>
                <div className="w-24 bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-n-red" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4: Kids profiles */}
      <section className="py-14 md:py-24 border-b-[8px] border-n-divider px-6">
        <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1 flex justify-center">
            {/* Kids Mockup */}
            <div className="w-full max-w-[400px] bg-n-surface border border-n-divider rounded-3xl p-6 shadow-2xl space-y-6">
              <p className="text-center font-bold text-n-text text-sm">Who's watching?</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Kids', bg: 'bg-[#5b9bd5]', emoji: '🦁' },
                  { name: 'Teens', bg: 'bg-[#ed7d31]', emoji: '🐼' },
                  { name: 'Family', bg: 'bg-[#70ad47]', emoji: '🦊' },
                  { name: 'Guest', bg: 'bg-[#ffc000]', emoji: '🐨' },
                ].map((item) => (
                  <div key={item.name} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className={`w-20 h-20 rounded-2xl ${item.bg} flex items-center justify-center text-4xl shadow-md border-2 border-transparent group-hover:border-n-white transition-all transform group-hover:scale-105`}>
                      {item.emoji}
                    </div>
                    <span className="text-xs font-semibold text-n-muted group-hover:text-n-white transition-colors">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-n-white">
              Create profiles for kids
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-n-text leading-relaxed font-medium">
              Send kids on adventures with their favorite characters in a space made just for them—free with your membership.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="py-16 md:py-24 border-b-[8px] border-n-divider px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-center text-n-white mb-10 md:mb-14">
            Frequently Asked Questions
          </h2>

          <div className="space-y-2">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-n-surface text-n-white border border-n-divider/40 rounded-sm">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between px-6 py-5 sm:py-6 text-left font-semibold text-lg sm:text-xl md:text-2xl hover:bg-n-raised/80 transition-colors"
                  >
                    <span>{item.q}</span>
                    <svg
                      className={`w-6 h-6 sm:w-8 sm:h-8 transform transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m-8-8h16" />
                    </svg>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-n-divider/40"
                      >
                        <div className="px-6 py-6 text-sm sm:text-base md:text-lg text-n-text font-normal leading-relaxed">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA повтор */}
          <div className="mt-14 text-center space-y-4">
            <p className="text-sm sm:text-lg md:text-xl text-n-text/95">
              Ready to watch? Enter your email to create or restart your membership.
            </p>
            <form onSubmit={handleGetStarted} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto">
              <div className="relative w-full sm:flex-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-5 py-4 bg-black/60 border border-n-muted/50 rounded-md text-n-white text-base focus:outline-none focus:border-n-white focus:ring-1 focus:ring-n-white transition-all placeholder:text-n-muted/80"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-4 bg-n-red hover:bg-n-red-hover text-white text-lg font-bold rounded-md flex items-center justify-center gap-2 transition-colors group shadow-lg"
              >
                Get Started
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
