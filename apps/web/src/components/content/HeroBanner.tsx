import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Content } from '../../api/content';
import { HeroBannerSkeleton } from '../ui/Skeleton';

interface HeroBannerProps {
  content?: Content;
  contents?: Content[];
  isLoading?: boolean;
}

export function HeroBanner({ content, contents, isLoading }: HeroBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const items = contents && contents.length > 0 
    ? contents 
    : (content ? [content] : []);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 6000); // cycle every 6s
    return () => clearInterval(interval);
  }, [items.length]);

  if (isLoading || items.length === 0) return <HeroBannerSkeleton />;

  const current = items[activeIndex];

  return (
    <section className="relative h-screen min-h-[600px] max-h-[1080px] overflow-hidden bg-n-black w-full">
      {/* Background Poster Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="w-full h-full relative"
          >
            <img
              src={current.backdropUrl}
              alt=""
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            {/* Ambient overlay vignette */}
            <div className="absolute inset-0 bg-hero-vignette z-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-n-bg via-n-bg/25 to-transparent z-0" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content overlays */}
      <div className="absolute inset-0 flex flex-col justify-end z-10">
        <div className="px-4 sm:px-6 md:px-16 pb-20 sm:pb-24 md:pb-32 max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Originals badge */}
              {current.isOriginal && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xs font-black uppercase tracking-[0.25em] text-n-red bg-n-red/10 border border-n-red/20 px-2 py-0.5 rounded">
                    V19+ Original
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-black leading-tight text-white mb-4 tracking-tight drop-shadow-md">
                {current.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm md:text-base mb-5 text-n-text/90 font-medium">
                {current.imdbScore && (
                  <span className="text-emerald-400 font-extrabold">{current.imdbScore} IMDb</span>
                )}
                {current.releaseYear && <span>{current.releaseYear}</span>}
                {current.rating && (
                  <span className="border border-white/20 px-2 py-0.5 text-2xs rounded bg-white/5 backdrop-blur-sm text-white font-bold">
                    {current.rating}
                  </span>
                )}
                {current.duration && (
                  <span>{Math.floor(current.duration / 60)}h {current.duration % 60}m</span>
                )}
                {current.genre && current.genre.length > 0 && (
                  <span className="text-n-muted">· {current.genre.slice(0, 3).join(' · ')}</span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6 line-clamp-3 max-w-2xl leading-relaxed text-shadow">
                {current.description}
              </p>

              {/* Buttons */}
              <div className="flex gap-4">
                <Link
                  href={`/watch/${current.slug}`}
                  className="flex items-center gap-3 px-6 sm:px-8 py-3 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-xl text-sm sm:text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play Now
                </Link>
                <Link
                  href={`/title/${current.slug}`}
                  className="flex items-center gap-3 px-6 sm:px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm sm:text-base backdrop-blur-md border border-white/10 transition-all hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  More Info
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-n-bg via-n-bg/70 to-transparent z-10 pointer-events-none" />
    </section>
  );
}
