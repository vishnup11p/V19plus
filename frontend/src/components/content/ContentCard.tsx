import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Content } from '../../api/content';
import { ProgressBar } from '../ui/ProgressBar';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useMatchScores } from '../../hooks/useContent';
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
  const { inList: checkInList, add, remove } = useWatchlist();
  const inList = checkInList(content.id);
  const isAuthenticated = useAuthStore((s: any) => s.isAuthenticated);
  const openDetail = useUiStore((s: any) => s.openDetail);
  const navigate = useNavigate();
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>();

  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const { data: scores } = useMatchScores(isAuthenticated ? [content.id] : []);
  const matchScore = scores?.[content.id];

  const widths = { sm: 'w-28 md:w-36', md: 'w-36 md:w-44', lg: 'w-44 md:w-56' };

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setHovered(true), 300);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    setCoords({ x, y });
    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Sign in to add to your list'); return; }
    try {
      if (inList) {
        await remove(content.id);
        toast.success('Removed from My List');
      } else {
        await add(content.id);
        toast.success('Added to My List');
      }
    } catch {
      // errors are handled by hook
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/watch/${content.slug}`);
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
      onMouseMove={handleMouseMove}
    >
      <Link 
        to={`/title/${content.slug}`} 
        className="block relative rounded-2xl overflow-hidden bg-[#181410] border border-white/5 transition-all duration-300 hover:border-[#FF5C00]/60 hover:shadow-2xl hover:shadow-[#FF5C00]/10"
        style={{
          transform: hovered ? 'none' : `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1)`,
          transition: 'transform 0.1s ease-out, border-color 0.25s, box-shadow 0.25s',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden">
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

          {/* Cursor tracking glow */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, rgba(255,92,0,0.25), transparent 60%)`,
              mixBlendMode: 'screen'
            }}
          />

          {/* Rank badge */}
          {rank !== undefined && rank <= 10 && (
            <div className="absolute bottom-1 left-2 z-10">
              <span
                className="text-7xl font-black leading-none"
                style={{
                  fontFamily: "'Big Shoulders Display', sans-serif",
                  color: 'transparent',
                  WebkitTextStroke: '2px rgba(255,92,0,0.65)',
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
            <div className="absolute top-3 left-3 bg-[#FF5C00]/25 backdrop-blur-md border border-[#FF5C00]/45 px-2 py-0.5 rounded-md">
              <span className="text-[10px] font-black text-[#FFB07A] uppercase tracking-wider">
                V19+ Original
              </span>
            </div>
          )}
        </div>

        {/* Title below card (visible on mobile) */}
        <p className="mt-1.5 text-xs text-n-muted truncate px-2 pb-2 md:hidden">{content.title}</p>
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
            onClick={(e: any) => e.preventDefault()}
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
                {matchScore ? (
                  <span className="text-emerald-400 font-bold">{matchScore}% Match</span>
                ) : content.imdbScore ? (
                  <span className="text-emerald-400 font-bold">{content.imdbScore} IMDb</span>
                ) : null}
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
