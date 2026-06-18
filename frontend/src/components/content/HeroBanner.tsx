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
    <section className="relative h-[80vh] min-h-[560px] max-h-[900px] overflow-hidden bg-n-black">
      {/* Backdrop */}
      <div className="absolute inset-0">
        <img
          src={content.backdropUrl}
          alt=""
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
      </div>

      {/* Gradients — Netflix style */}
      <div className="absolute inset-0 bg-gradient-to-r from-n-bg via-n-bg/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-n-bg via-transparent to-n-bg/20" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 flex flex-col justify-end h-full px-6 md:px-16 pb-20 md:pb-28 max-w-2xl"
      >
        {/* Originals badge */}
        {content.isOriginal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-3"
          >
            <span className="text-2xs font-black uppercase tracking-[0.2em] text-n-red">
              V19+ Original
            </span>
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-5xl md:text-7xl font-black leading-none text-shadow mb-4"
        >
          {content.title}
        </motion.h1>

        {/* Meta */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-4 text-n-text/80"
        >
          {content.imdbScore && (
            <span className="text-emerald-400 font-bold">{content.imdbScore} IMDb</span>
          )}
          {content.releaseYear && <span>{content.releaseYear}</span>}
          {content.rating && (
            <span className="border border-n-text/40 px-1.5 py-0.5 text-2xs rounded">
              {content.rating}
            </span>
          )}
          {content.duration && (
            <span>{Math.floor(content.duration / 60)}h {content.duration % 60}m</span>
          )}
          {content.genre?.[0] && <span className="text-n-muted">{content.genre.slice(0, 3).join(' · ')}</span>}
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm md:text-base text-n-text/80 mb-6 line-clamp-3 max-w-xl text-shadow-sm"
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
            className="flex items-center gap-2 px-7 py-3 bg-n-white hover:bg-n-white/80 text-black font-bold rounded text-base transition-all active:scale-95"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </Link>
          <Link
            to={`/title/${content.slug}`}
            className="flex items-center gap-2 px-7 py-3 bg-n-muted/40 hover:bg-n-muted/60 text-white font-semibold rounded text-base backdrop-blur-sm border border-white/10 transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            More Info
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-n-bg to-transparent" />
    </section>
  );
}
