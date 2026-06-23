import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Content } from '../../api/content';
import { HeroBannerSkeleton } from '../ui/Skeleton';
import { TiltCard } from '../ui/TiltCard';

interface HeroBannerProps {
  content?: Content;
  isLoading?: boolean;
}

export function HeroBanner({ content, isLoading }: HeroBannerProps) {
  if (isLoading || !content) return <HeroBannerSkeleton />;

  return (
    <section className="relative h-[85vh] min-h-[580px] max-h-[1000px] overflow-hidden bg-v-black -mt-16 pt-16 perspective-1000">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
      >
        <img
          src={content.backdropUrl}
          alt=""
          className="w-full h-full object-cover object-center opacity-60 mix-blend-screen"
          loading="eager"
        />
        {/* Glow & grid light leak overlays */}
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-screen"
          style={{
            background: `
              radial-gradient(ellipse 65% 55% at 80% 0%, rgba(255,92,0,0.3), transparent 60%),
              linear-gradient(to right, #0A0806 0%, rgba(10,8,6,0.5) 50%, transparent 100%),
              linear-gradient(to top, #0A0806 0%, rgba(10,8,6,0.3) 40%, transparent 100%)
            `
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 64px)'
          }}
        />
      </motion.div>

      {/* Floating Particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-v-orange opacity-40 shadow-orange-glow z-0"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -Math.random() * 150 - 50],
            x: [0, Math.random() * 50 - 25],
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 35, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', type: 'spring' }}
        className="relative z-10 flex flex-col justify-end h-full px-6 md:px-16 pb-20 md:pb-24 max-w-2xl transform-gpu"
      >
        <TiltCard depth={10}>
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-4 text-xs font-black tracking-widest text-v-orange uppercase drop-shadow-glow"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-v-orange shadow-[0_0_10px_#FF5C00]" />
            {content.isOriginal ? 'V19+ Original' : 'Now Streaming'}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-5xl md:text-[84px] font-display font-black leading-[0.88] text-white uppercase mb-6 drop-shadow-3d transform-gpu"
          >
            {content.title}
          </motion.h1>

          {/* Meta */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-semibold mb-5 text-v-text drop-shadow-md"
          >
            {content.imdbScore && (
              <span className="text-emerald-400 font-bold">{content.imdbScore} IMDb</span>
            )}
            {content.releaseYear && <span>{content.releaseYear}</span>}
            {content.rating && (
              <span className="border border-v-orange/40 px-2 py-0.5 text-2xs rounded-md text-[#FFB07A] bg-v-orange/10 shadow-orange-glow">
                {content.rating}
              </span>
            )}
            {content.duration && (
              <span>{Math.floor(content.duration / 60)}h {content.duration % 60}m</span>
            )}
            {content.genre?.[0] && <span className="text-v-muted">{content.genre.slice(0, 3).join(' · ')}</span>}
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm md:text-base text-v-muted mb-8 line-clamp-3 max-w-xl leading-relaxed drop-shadow-md"
          >
            {content.description}
          </motion.p>
        </TiltCard>

        {/* Buttons */}
        <TiltCard depth={20}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4"
          >
            <Link
              to={`/watch/${content.slug}`}
              className="flex items-center gap-2 px-8 py-4 bg-v-orange hover:bg-v-orange-deep text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-orange-glow hover:shadow-[0_0_30px_rgba(255,92,0,0.8)] border border-white/20"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              INITIALIZE
            </Link>
            <Link
              to={`/title/${content.slug}`}
              className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-v-text font-bold rounded-xl text-lg backdrop-blur-xl border border-white/10 transition-all hover:scale-105 active:scale-95 shadow-card-glow hover:shadow-glass-edge"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              DATA ARCHIVE
            </Link>
          </motion.div>
        </TiltCard>
      </motion.div>
    </section>
  );
}
