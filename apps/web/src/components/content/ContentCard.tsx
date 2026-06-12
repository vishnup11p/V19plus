import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Content } from '../../api/content';
import { ProgressBar } from '../ui/ProgressBar';
import { watchlistApi } from '../../api/watchlist';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import toast from 'react-hot-toast';

interface ContentCardProps {
  content: Content;
  progress?: number;
  rank?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ContentCard({ content, progress, rank, size = 'md' }: ContentCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [inList, setInList] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openDetail = useUiStore((s) => s.openDetail);
  const router = useRouter();
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>();

  const widths = { sm: 'w-28 md:w-36', md: 'w-36 md:w-44', lg: 'w-44 md:w-56' };

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setHovered(true), 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    setHovered(false);
  };

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Sign in to add to your list'); return; }
    try {
      if (inList) {
        await watchlistApi.remove(content.id);
        setInList(false);
        toast.success('Removed from My List');
      } else {
        await watchlistApi.add(content.id);
        setInList(true);
        toast.success('Added to My List');
      }
    } catch {
      toast.error(inList ? 'Already in your list' : 'Could not update list');
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/watch/${content.slug}`);
  };

  const handleMoreInfo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDetail(content.slug);
  };

  return (
    <div
      className={`relative flex-shrink-0 ${widths[size]} group`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/title/${content.slug}`} className="block">
        {/* Thumbnail */}
        <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-n-surface">
          {!imgError ? (
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-n-raised">
              <span className="text-4xl">🎬</span>
            </div>
          )}

          {/* Rank badge */}
          {rank !== undefined && rank <= 10 && (
            <div className="absolute bottom-0 left-0 w-10 h-14 flex items-end justify-start">
              <span
                className="text-6xl font-black leading-none text-n-white"
                style={{
                  WebkitTextStroke: '2px #1f1f1f',
                  textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                  fontFamily: 'Arial Black, sans-serif',
                }}
              >
                {rank}
              </span>
            </div>
          )}

          {/* Progress bar */}
          {progress !== undefined && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
              <ProgressBar progress={progress} />
            </div>
          )}

          {/* Original badge */}
          {content.isOriginal && !rank && (
            <div className="absolute top-2 left-2">
              <span className="text-2xs font-black text-n-red uppercase tracking-wider">
                V19+
              </span>
            </div>
          )}
        </div>

        {/* Title below card (visible on mobile) */}
        <p className="mt-1.5 text-xs text-n-muted truncate px-0.5 md:hidden">{content.title}</p>
      </Link>

      {/* Hover card */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 -top-4 w-64 md:w-72 bg-n-bg rounded-lg overflow-hidden shadow-netflix z-30 pointer-events-auto"
            style={{ zIndex: 30 }}
            onMouseEnter={() => clearTimeout(hoverTimeout.current)}
            onMouseLeave={() => setHovered(false)}
            onClick={(e) => e.preventDefault()}
          >
            {/* Preview image */}
            <div className="relative aspect-video overflow-hidden bg-n-surface">
              <img
                src={content.backdropUrl || content.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-n-bg/80 to-transparent" />
              {/* Play button overlay */}
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                  <svg className="w-7 h-7 fill-white ml-1" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="font-semibold text-sm mb-1.5 text-n-white">{content.title}</p>

              {/* Action buttons row */}
              <div className="flex items-center gap-2 mb-2.5">
                <button
                  onClick={handlePlay}
                  className="w-9 h-9 rounded-full bg-n-white flex items-center justify-center hover:bg-n-white/80 transition-colors flex-shrink-0"
                  title="Play"
                >
                  <svg className="w-4 h-4 fill-black ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <button
                  onClick={handleWatchlist}
                  className="w-9 h-9 rounded-full border-2 border-n-muted flex items-center justify-center hover:border-n-white text-n-muted hover:text-n-white transition-colors flex-shrink-0"
                  title={inList ? 'Remove from My List' : 'Add to My List'}
                >
                  {inList
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  }
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleMoreInfo}
                  className="w-9 h-9 rounded-full border-2 border-n-muted flex items-center justify-center hover:border-n-white text-n-muted hover:text-n-white transition-colors flex-shrink-0"
                  title="More Info"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                {content.imdbScore && (
                  <span className="text-emerald-400 font-bold">{content.imdbScore} IMDb</span>
                )}
                {content.releaseYear && <span className="text-n-muted">{content.releaseYear}</span>}
                {content.rating && (
                  <span className="border border-n-muted/50 px-1 rounded text-2xs text-n-muted">
                    {content.rating}
                  </span>
                )}
              </div>

              {/* Genres */}
              {content.genre && content.genre.length > 0 && (
                <p className="text-xs text-n-muted mt-1.5">
                  {content.genre.slice(0, 3).map((g, i) => (
                    <span key={g}>
                      {i > 0 && <span className="mx-1.5 text-n-divider">·</span>}
                      {g}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
