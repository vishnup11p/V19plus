import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TiltCard } from '../components/ui/TiltCard';

const FAQ_ITEMS = [
  {
    q: 'What makes V19+ different?',
    a: 'V19+ is built on a custom spatial-rendering engine that brings cinematic depth directly to your screen. With our massive library of premium originals and interactive storytelling, it’s not just streaming—it’s an experience.',
  },
  {
    q: 'How much does V19+ cost?',
    a: 'Premium access starts at $9.99 a month for 4K Spatial Audio streaming. No hidden fees, no contracts. Upgrade or downgrade your reality anytime.',
  },
  {
    q: 'Where can I watch?',
    a: 'Anywhere. V19+ runs flawlessly in modern browsers, smart TVs, and spatial computing headsets.',
  },
  {
    q: 'How do I cancel?',
    a: 'We make it easy. Two clicks in your holographic dashboard and your subscription ends. No fees, no questions asked.',
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
    <div className="text-v-text bg-v-black overflow-hidden font-sans perspective-1000">
      {/* ── 3D PARALLAX HERO SECTION ── */}
      <section className="relative min-h-[100vh] w-full flex items-center justify-center overflow-hidden bg-v-black">
        {/* Deep Z-Axis Background Image */}
        <motion.div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=2000&auto=format&fit=crop')`,
            transform: 'translateZ(-100px) scale(1.2)'
          }}
          animate={{ scale: [1.2, 1.25, 1.2], rotateZ: [0, 1, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Floating Particles in 3D Space */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-v-orange opacity-20 shadow-orange-glow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* 3D Vignette & Glass overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-v-black via-v-black/80 to-transparent z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,8,6,0.9)_100%)] z-0" />

        {/* Foreground Hero Content (Floating) */}
        <motion.div 
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
          initial={{ opacity: 0, rotateX: 20, y: 50 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        >
          <TiltCard depth={5}>
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-display font-black tracking-tighter leading-[0.9] text-v-text drop-shadow-3d mix-blend-plus-lighter">
              ENTER THE
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-v-orange to-v-orange-deep drop-shadow-glow">NEXT DIMENSION</span>
            </h1>
          </TiltCard>

          <motion.p 
            className="text-lg sm:text-2xl md:text-3xl mt-8 text-v-text/90 font-medium tracking-wide drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Cinematic immersion. Holographic interfaces.
          </motion.p>

          {/* Glowing 3D Form */}
          <motion.form 
            onSubmit={handleGetStarted}
            className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4 max-w-2xl mx-auto relative z-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="relative w-full md:flex-1 group perspective-1000">
              <div className="absolute inset-0 bg-v-orange-glow blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Initialize your uplink (Email)"
                className="relative w-full px-6 py-5 bg-v-card/40 backdrop-blur-2xl border-2 border-white/10 rounded-2xl text-v-text text-lg focus:outline-none focus:border-v-orange focus:shadow-orange-edge transition-all placeholder:text-v-muted font-medium z-10 shadow-3d-lift"
              />
            </div>
            <button
              type="submit"
              className="relative w-full md:w-auto px-10 py-5 bg-v-orange hover:bg-v-orange-deep text-white text-lg font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-orange-glow hover:shadow-[0_0_40px_rgba(255,92,0,0.8)] border border-white/20 group z-10"
            >
              JACK IN
              <motion.svg 
                className="w-6 h-6 transform group-hover:translate-x-2 transition-transform drop-shadow-md" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </motion.svg>
            </button>
          </motion.form>
        </motion.div>
      </section>

      {/* ── 3D BENTO FEATURES GRID ── */}
      <section className="py-32 relative z-20 bg-v-black overflow-hidden">
        {/* Connecting neon line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-v-orange/50 to-transparent -translate-x-1/2 blur-[1px]" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 relative">
          
          {/* Bento Card 1 */}
          <TiltCard depth={20} className="w-full">
            <div className="h-[500px] rounded-[2rem] bg-glass-gradient backdrop-blur-xl border border-white/10 p-8 flex flex-col justify-between overflow-hidden relative shadow-card-glow group">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1593789198777-f29bc259780e?q=80&w=1000')] bg-cover bg-center opacity-20 mix-blend-luminosity group-hover:opacity-40 transition-opacity duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-v-black via-v-black/50 to-transparent" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-v-orange/20 border border-v-orange/50 flex items-center justify-center text-3xl shadow-orange-glow mb-6 backdrop-blur-md">
                  📺
                </div>
                <h2 className="text-4xl font-display font-bold text-v-text drop-shadow-lg">Spatial Displays</h2>
                <p className="mt-4 text-lg text-v-muted font-medium">Render our worlds on smart TVs, consoles, and immersive headsets with zero latency.</p>
              </div>

              {/* Floating Hologram Mockup */}
              <motion.div 
                className="relative z-10 h-40 w-[110%] -ml-[5%] rounded-t-3xl border-t-2 border-x-2 border-white/20 bg-v-card/80 backdrop-blur-3xl shadow-3d-lift mt-8"
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="absolute top-4 left-4 right-4 h-full bg-v-orange/10 rounded-t-xl border border-v-orange/30 overflow-hidden">
                  <div className="w-full h-1 bg-v-orange/50 shadow-orange-glow animate-pulse" />
                </div>
              </motion.div>
            </div>
          </TiltCard>

          {/* Bento Card 2 */}
          <TiltCard depth={20} className="w-full md:mt-24">
            <div className="h-[500px] rounded-[2rem] bg-glass-gradient backdrop-blur-xl border border-white/10 p-8 flex flex-col justify-between overflow-hidden relative shadow-card-glow group">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000')] bg-cover bg-center opacity-20 mix-blend-luminosity group-hover:opacity-40 transition-opacity duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-v-black via-v-black/50 to-transparent" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-v-orange/20 border border-v-orange/50 flex items-center justify-center text-3xl shadow-orange-glow mb-6 backdrop-blur-md">
                  ⚡
                </div>
                <h2 className="text-4xl font-display font-bold text-v-text drop-shadow-lg">Neural Downloads</h2>
                <p className="mt-4 text-lg text-v-muted font-medium">Cache entire seasons directly to your portable node for offline reality warping.</p>
              </div>

              {/* Download UI */}
              <div className="relative z-10 flex items-center gap-4 bg-v-black/60 border border-v-orange/40 rounded-2xl p-4 backdrop-blur-2xl shadow-[inset_0_0_20px_rgba(255,92,0,0.2)] mt-auto mb-4">
                 <div className="w-12 h-16 bg-v-raised rounded-lg border border-white/10 overflow-hidden shadow-lg">
                    <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100" className="w-full h-full object-cover opacity-80" />
                 </div>
                 <div className="flex-1">
                   <div className="h-2 w-3/4 bg-v-raised rounded-full overflow-hidden mb-2">
                     <div className="h-full bg-v-orange w-[74%] shadow-orange-glow" />
                   </div>
                   <p className="text-xs text-v-orange font-bold tracking-widest uppercase">Syncing to Node... 74%</p>
                 </div>
              </div>
            </div>
          </TiltCard>

        </div>
      </section>

      {/* ── 3D ACCORDION FAQ ── */}
      <section className="py-32 relative z-20 bg-v-black border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <TiltCard depth={5}>
            <h2 className="text-5xl md:text-7xl font-display font-black text-center text-v-text mb-16 drop-shadow-3d">
              DECRYPTED <span className="text-v-orange drop-shadow-glow">DATA</span>
            </h2>
          </TiltCard>

          <div className="space-y-4 perspective-1000">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <TiltCard depth={2} key={idx}>
                  <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-card-glow transition-all hover:border-v-orange/50">
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between px-8 py-6 text-left font-display font-bold text-2xl md:text-3xl tracking-wide group"
                    >
                      <span className="group-hover:text-v-orange transition-colors drop-shadow-md">{item.q}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        className="w-10 h-10 rounded-full bg-v-raised border border-white/10 flex items-center justify-center text-v-orange shadow-inner"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m-8-8h16" />
                        </svg>
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, rotateX: -10 }}
                          animate={{ height: 'auto', opacity: 1, rotateX: 0 }}
                          exit={{ height: 0, opacity: 0, rotateX: -10 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="origin-top"
                        >
                          <div className="px-8 pb-8 pt-2 text-lg md:text-xl text-v-muted font-medium leading-relaxed border-t border-white/5 mt-2 bg-v-black/20">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
