import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Content } from '../../api/content';
import { HeroBannerSkeleton } from '../ui/Skeleton';

interface HeroBannerProps {
  content?: Content;
  isLoading?: boolean;
}

export function HeroBanner({ content, isLoading }: HeroBannerProps) {
  if (isLoading || !content) return <HeroBannerSkeleton />;

  return (
    <section className="relative h-[85vh] min-h-[580px] max-h-[1000px] overflow-hidden bg-[#0A0806] -mt-16 pt-16">
      {/* Backdrop */}
      <div className="absolute inset-0">
        <img
          src={content.backdropUrl}
          alt=""
          className="w-full h-full object-cover object-center opacity-70"
          loading="eager"
        />
        {/* Glow & grid light leak overlays */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 65% 55% at 80% 0%, rgba(255,92,0,0.22), transparent 60%),
              linear-gradient(to right, #0A0806 0%, rgba(10,8,6,0.5) 50%, transparent 100%),
              linear-gradient(to top, #0A0806 0%, rgba(10,8,6,0.3) 40%, transparent 100%)
            `
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 64px)'
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex flex-col justify-end h-full px-6 md:px-16 pb-20 md:pb-24 max-w-2xl"
      >
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 mb-4 text-xs font-black tracking-widest text-[#FF5C00] uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00]" style={{ boxShadow: '0 0 10px #FF5C00' }} />
          {content.isOriginal ? 'V19+ Original' : 'Now Streaming'}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-5xl md:text-[84px] font-black leading-[0.88] text-shadow uppercase mb-6 tracking-normal"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          {content.title}
        </motion.h1>

        {/* Meta */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-semibold mb-5 text-[#FAF6EF]"
        >
          {content.imdbScore && (
            <span className="text-emerald-400 font-bold">{content.imdbScore} IMDb</span>
          )}
          {content.releaseYear && <span>{content.releaseYear}</span>}
          {content.rating && (
            <span className="border border-[#FF5C00]/40 px-2 py-0.5 text-2xs rounded-md text-[#FFB07A] bg-[#FF5C00]/10">
              {content.rating}
            </span>
          )}
          {content.duration && (
            <span>{Math.floor(content.duration / 60)}h {content.duration % 60}m</span>
          )}
          {content.genre?.[0] && <span className="text-[#8C8478]">{content.genre.slice(0, 3).join(' · ')}</span>}
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm md:text-base text-[#8C8478] mb-8 line-clamp-3 max-w-xl text-shadow-sm leading-relaxed"
        >
          {content.description}
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          <Link
            to={`/watch/${content.slug}`}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-[#0A0806] font-bold rounded-xl text-base transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-[#FF5C00]/10 hover:shadow-[#FF5C00]/25"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </Link>
          <Link
            to={`/title/${content.slug}`}
            className="flex items-center gap-2 px-8 py-3.5 bg-white/5 hover:bg-white/10 text-[#FAF6EF] font-bold rounded-xl text-base backdrop-blur-md border border-white/10 transition-all hover:scale-[1.03] active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            More Info
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
