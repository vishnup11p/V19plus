import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrowse } from '../hooks/useContent';
import { Link } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import type { Content } from '../api/content';
import { TiltCard } from '../components/ui/TiltCard';
import { motion, AnimatePresence } from 'framer-motion';

const TYPES = [
  { value: '', label: 'ALL REALITIES' },
  { value: 'MOVIE', label: 'CINEMA' },
  { value: 'SERIES', label: 'EPISODIC' },
  { value: 'LIVE', label: 'LIVE FEEDS' },
  { value: 'ORIGINALS', label: 'V19+ EXCLUSIVES' },
];

export function Browse() {
  const [type, setType] = useState('');
  const { data, isLoading } = useBrowse(
    type === 'ORIGINALS' ? undefined : (type || undefined),
    undefined
  );
  const navigate = useNavigate();

  let items: Content[] = data?.items || [];
  if (type === 'ORIGINALS') {
    items = items.filter(item => item.isOriginal);
  }

  return (
    <div className="min-h-screen bg-v-black pt-20 pb-24 px-4 md:px-12 relative overflow-hidden perspective-1000">
      
      {/* 3D Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [transform:rotateX(60deg)_translateZ(-200px)_translateY(-100px)] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-v-black via-v-black/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header row */}
        <div className="flex items-center justify-between mb-10 mt-8">
          <TiltCard depth={5}>
            <h1 className="text-5xl md:text-7xl font-display font-black text-v-text tracking-tighter drop-shadow-3d">
              SPATIAL <span className="text-v-orange drop-shadow-glow">ARCHIVE</span>
            </h1>
          </TiltCard>
          <TiltCard depth={10}>
            <button
              onClick={() => navigate('/search')}
              className="w-14 h-14 rounded-2xl bg-v-card/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-v-orange hover:text-white hover:bg-v-orange transition-all shadow-card-glow hover:shadow-[0_0_20px_rgba(255,92,0,0.6)]"
              aria-label="Search"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </TiltCard>
        </div>

        {/* Floating Holographic Filters */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide mb-12 py-4 px-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex-shrink-0 px-6 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${
                type === t.value
                  ? 'bg-v-orange text-white shadow-orange-glow border-b-4 border-v-orange-deep transform -translate-y-1'
                  : 'bg-v-card/40 backdrop-blur-md text-v-muted border border-white/5 hover:border-v-orange/50 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 3D Holographic Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-3xl bg-v-card/40 backdrop-blur-md border border-white/5 animate-pulse" />
              ))}
            </motion.div>
          ) : items.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, rotateX: -20, y: 50 }} 
              animate={{ opacity: 1, rotateX: 0, y: 0 }} 
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 perspective-1000"
            >
              {items.map((item, index) => (
                <TiltCard key={item.id} depth={15}>
                  <Link
                    to={`/title/${item.slug}`}
                    className="block group relative aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/10 hover:border-v-orange/60 transition-all duration-300 shadow-card-glow hover:shadow-orange-glow bg-v-raised"
                  >
                    {item.thumbnailUrl && (
                      <div className="absolute inset-0 z-0">
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-v-black via-v-black/40 to-transparent mix-blend-multiply" />
                      </div>
                    )}
                    
                    {/* Holographic Overlay on Hover */}
                    <div className="absolute inset-0 bg-v-orange-glow opacity-0 group-hover:opacity-20 mix-blend-screen transition-opacity duration-500 z-10" />

                    {/* Content */}
                    <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="font-display font-black text-xl text-white leading-none drop-shadow-md">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-v-orange w-[80%] shadow-orange-glow" />
                        </div>
                        <span className="text-[10px] text-v-orange font-bold uppercase tracking-widest">Accessing</span>
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <TiltCard depth={20}>
                <div className="w-32 h-32 rounded-3xl bg-v-card/40 backdrop-blur-xl border border-white/5 flex items-center justify-center text-6xl shadow-card-glow mb-6 text-v-orange drop-shadow-glow">
                  📡
                </div>
              </TiltCard>
              <h2 className="text-3xl font-display font-bold text-v-text mb-2 drop-shadow-md">NO SIGNALS FOUND</h2>
              <p className="text-v-muted text-sm font-medium tracking-wide">Adjust your node filters or check back later.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
