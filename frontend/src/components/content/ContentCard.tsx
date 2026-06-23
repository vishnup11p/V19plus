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
import { TiltCard } from '../ui/TiltCard';

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

  const { data: scores } = useMatchScores(isAuthenticated ? [content.id] : []);
  const matchScore = scores?.[content.id];

  const widths = { sm: 'w-28 md:w-36', md: 'w-36 md:w-44', lg: 'w-44 md:w-56' };

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setHovered(true), 400);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    setHovered(false);
  };

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Sign in to link to your node'); return; }
    try {
      if (inList) {
        await remove(content.id);
        toast.success('Removed from Node');
      } else {
        await add(content.id);
        toast.success('Linked to Node');
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
      className={`relative flex-shrink-0 ${widths[size]} perspective-1000 group`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <TiltCard depth={12}>
        <Link 
          to={`/title/${content.slug}`} 
          className="block relative rounded-[2rem] overflow-hidden bg-v-card border border-white/5 transition-all duration-500 hover:border-v-orange/60 hover:shadow-orange-glow"
        >
          {/* Thumbnail */}
          <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden bg-v-raised">
            {!imgError ? (
              <>
                <img
                  src={content.thumbnailUrl}
                  alt={content.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  loading="lazy"
                  onError={() => setImgError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-v-black via-v-black/20 to-transparent opacity-60 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-0" />
              </>
            ) : (
              <div className={`w-full h-full flex flex-col justify-end p-5 border border-white/5 ${
                (() => {
                  const t = content.title.toLowerCase();
                  if (t.includes('glass') || t.includes('city')) return 'bg-gradient-to-b from-[#0f766e] via-[#042f2e] to-[#0A0806]';
                  if (t.includes('red') || t.includes('tide')) return 'bg-gradient-to-b from-[#991b1b] via-[#450a0a] to-[#0A0806]';
                  if (t.includes('deep') || t.includes('static')) return 'bg-gradient-to-b from-[#3730a3] via-[#1e1b4b] to-[#0A0806]';
                  if (t.includes('solstice')) return 'bg-gradient-to-b from-[#854d0e] via-[#422006] to-[#0A0806]';
                  if (t.includes('horizon')) return 'bg-gradient-to-b from-[#b45309] via-[#78350f] to-[#0A0806]';
                  return 'bg-gradient-to-b from-v-card to-v-black';
                })()
              }`}>
                <h4 className="font-display font-black text-lg text-white leading-tight drop-shadow-md group-hover:text-v-orange transition-colors">
                  {content.title}
                </h4>
              </div>
            )}

            {/* Holographic Overlays */}
            <div className="absolute inset-0 bg-v-orange-glow opacity-0 group-hover:opacity-20 mix-blend-screen transition-opacity duration-500 z-10" />

            {/* Title overlay on hover (only if image didn't error) */}
            {!imgError && (
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex flex-col justify-end bg-gradient-to-t from-v-black via-v-black/80 to-transparent">
                <h3 className="font-display font-black text-lg text-white leading-tight drop-shadow-md">
                  {content.title}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-v-orange w-[60%] shadow-orange-glow" />
                  </div>
                  <span className="text-[8px] text-v-orange font-bold uppercase tracking-widest">Access</span>
                </div>
              </div>
            )}

            {/* Rank badge */}
            {rank !== undefined && rank <= 10 && (
              <div className="absolute bottom-2 left-2 z-30 pointer-events-none drop-shadow-3d">
                <span
                  className="text-[100px] font-display font-black leading-none drop-shadow-md"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: '3px rgba(255,92,0,0.85)',
                  }}
                >
                  {rank}
                </span>
              </div>
            )}

            {/* Progress bar */}
            {progress !== undefined && progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 z-30">
                <ProgressBar progress={progress} />
              </div>
            )}

            {/* Original badge */}
            {content.isOriginal && !rank && (
              <div className="absolute top-4 left-4 bg-v-orange/20 backdrop-blur-md border border-v-orange/40 px-2.5 py-1 rounded-lg shadow-orange-glow z-30">
                <span className="text-[9px] font-black text-v-orange uppercase tracking-widest drop-shadow-glow">
                  Original
                </span>
              </div>
            )}
          </div>
        </Link>
      </TiltCard>

      {/* Title below card (visible on mobile if no hover title) */}
      <p className="mt-2 text-xs text-v-muted truncate px-2 md:hidden font-medium">{content.title}</p>

      {/* Hover card (The popup details modal) */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10, rotateX: -20 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.4 }}
            className="absolute left-1/2 -translate-x-1/2 -top-6 w-72 md:w-80 bg-glass-gradient backdrop-blur-3xl rounded-[2rem] overflow-hidden shadow-3d-lift border border-white/10 z-40 pointer-events-auto transform-gpu"
            onMouseEnter={() => clearTimeout(hoverTimeout.current)}
            onMouseLeave={() => setHovered(false)}
            onClick={(e: any) => e.preventDefault()}
          >
            {/* Preview image */}
            <div className="relative aspect-video overflow-hidden bg-v-raised">
              <img
                src={content.backdropUrl || content.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover opacity-90"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-v-black via-v-black/40 to-transparent" />
              {/* Play button overlay */}
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center group/play"
              >
                <div className="w-16 h-16 rounded-full bg-v-orange/20 backdrop-blur-md border border-v-orange/50 flex items-center justify-center group-hover/play:bg-v-orange group-hover/play:scale-110 transition-all shadow-orange-glow">
                  <svg className="w-8 h-8 fill-white ml-1 drop-shadow-md" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Info */}
            <div className="p-5">
              <p className="font-display font-black text-xl mb-2 text-white drop-shadow-md">{content.title}</p>

              {/* Action buttons row */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handlePlay}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-white/80 transition-colors flex-shrink-0 shadow-md hover:scale-105 active:scale-95"
                  title="Initialize"
                >
                  <svg className="w-5 h-5 fill-v-black ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <button
                  onClick={handleWatchlist}
                  className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center hover:border-v-orange hover:bg-v-orange/10 text-white transition-colors flex-shrink-0 hover:scale-105 active:scale-95"
                  title={inList ? 'Delink Node' : 'Link Node'}
                >
                  {inList
                    ? <svg className="w-5 h-5 text-v-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  }
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleMoreInfo}
                  className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center hover:border-white text-white transition-colors flex-shrink-0 hover:scale-105 active:scale-95"
                  title="Data Archive"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">
                {matchScore ? (
                  <span className="text-v-orange font-black drop-shadow-glow">{matchScore}% MATCH</span>
                ) : content.imdbScore ? (
                  <span className="text-v-orange font-black drop-shadow-glow">{content.imdbScore} IMDB</span>
                ) : null}
                {content.releaseYear && <span className="text-v-muted">{content.releaseYear}</span>}
                {content.rating && (
                  <span className="border border-white/20 px-1.5 py-0.5 rounded text-[10px] text-v-text bg-white/5">
                    {content.rating}
                  </span>
                )}
              </div>

              {/* Genres */}
              {content.genre && content.genre.length > 0 && (
               <p className="text-xs text-v-muted font-medium mt-3">
                  {content.genre.slice(0, 3).map((g, i) => (
                    <span key={g}>
                      {i > 0 && <span className="mx-2 text-white/20">·</span>}
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
