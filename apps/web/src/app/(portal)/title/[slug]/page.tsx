'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useContent } from '../../../../hooks/useContent';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { ProgressBar } from '../../../../components/ui/ProgressBar';
import { useAuthStore } from '../../../../store/authStore';
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '../../../../hooks/useWatchlist';
import toast from 'react-hot-toast';

export default function TitleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const { data: content, isLoading } = useContent(slug || '');
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [activeSeason, setActiveSeason] = useState(0);

  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const inList = !!(content && watchlist?.some((item: any) => item.content.id === content.id));

  const handleWatchlist = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to add to your list');
      return;
    }
    if (!content) return;
    try {
      if (inList) {
        await removeFromWatchlist.mutateAsync(content.id);
        toast.success('Removed from My List');
      } else {
        await addToWatchlist.mutateAsync(content.id);
        toast.success('Added to My List');
      }
    } catch {
      toast.error('Could not update list');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-n-bg animate-pulse">
        <Skeleton className="h-[55vh] w-full rounded-none" />
        <div className="px-4 md:px-12 py-8 space-y-4">
          <Skeleton className="h-10 w-1/2 rounded" />
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-20 w-2/3 rounded" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-n-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h1 className="text-2xl font-bold text-n-white mb-2">Title not found</h1>
          <p className="text-n-muted mb-6">This content may have been removed or is unavailable.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-n-white text-black font-bold rounded hover:bg-n-white/80 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentSeason = content.seasons?.[activeSeason];

  return (
    <div className="min-h-screen bg-n-bg animate-fade-in">
      {/* Backdrop hero */}
      <div className="relative h-[55vh] md:h-[65vh] overflow-hidden">
        <img
          src={content.backdropUrl}
          alt=""
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-n-bg via-n-bg/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-n-bg via-transparent to-n-bg/20" />
      </div>

      {/* Main content */}
      <div className="relative z-10 -mt-48 md:-mt-64 px-4 md:px-12 pb-16">
        <div className="max-w-5xl">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {content.isOriginal && (
              <span className="text-2xs font-black uppercase tracking-widest text-n-red">V19+ Original</span>
            )}
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-n-white leading-none mb-4 text-shadow"
          >
            {content.title}
          </motion.h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm mb-4">
            {content.imdbScore && (
              <span className="text-emerald-400 font-bold text-base">{content.imdbScore} IMDb</span>
            )}
            <span className="text-n-muted">{content.releaseYear}</span>
            {content.rating && (
              <span className="border border-n-muted/50 px-2 py-0.5 rounded text-xs text-n-muted">{content.rating}</span>
            )}
            {content.duration && (
              <span className="text-n-muted">{Math.floor(content.duration / 60)}h {content.duration % 60}m</span>
            )}
            <span className="bg-n-surface border border-n-divider text-n-muted px-2 py-0.5 rounded text-xs uppercase">
              {content.type}
            </span>
          </div>

          {/* Progress */}
          {content.watchProgress && content.watchProgress.progress > 0 && (
            <div className="mb-5 max-w-xs">
              <ProgressBar progress={content.watchProgress.progress} />
              <p className="text-xs text-n-muted mt-1">{Math.round(content.watchProgress.progress)}% watched</p>
            </div>
          )}

          {/* Description */}
          <p className="text-n-text/80 text-base leading-relaxed mb-6 max-w-2xl">
            {content.description}
          </p>

          {/* Genre tags */}
          {content.genre && content.genre.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {content.genre.map((g) => (
                <span key={g} className="text-xs px-3 py-1.5 rounded-full bg-n-surface border border-n-divider text-n-muted">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mb-10">
            <Link
              href={`/watch/${content.slug}`}
              className="flex items-center gap-2 px-8 py-3.5 bg-n-white hover:bg-n-white/80 text-black font-bold rounded text-base transition-all active:scale-95"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Play
            </Link>
            <button
              onClick={handleWatchlist}
              className="flex items-center gap-2 px-6 py-3.5 bg-n-muted/30 hover:bg-n-muted/50 text-white border border-white/20 backdrop-blur-sm font-semibold rounded text-base transition-all"
            >
              {inList
                ? <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> In My List</>
                : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> My List</>
              }
            </button>
            {content.trailerUrl && (
              <a
                href={content.trailerUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3.5 bg-transparent hover:bg-n-surface text-white border border-n-divider font-semibold rounded text-base transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                Trailer
              </a>
            )}
          </div>

          {/* Cast */}
          {content.cast && content.cast.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-bold text-n-white mb-4">Cast</h2>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {content.cast.map((member) => (
                  <div key={member.id} className="flex-shrink-0 text-center w-20">
                    <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden bg-n-raised border-2 border-n-divider">
                      {member.photoUrl
                        ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-n-muted">{member.name.charAt(0)}</div>
                      }
                    </div>
                    <p className="text-xs font-semibold text-n-text truncate">{member.name}</p>
                    <p className="text-2xs text-n-muted truncate">{member.role}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Episodes */}
          {content.seasons && content.seasons.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-n-white">Episodes</h2>
                {content.seasons.length > 1 && (
                  <div className="relative">
                    <select
                      value={activeSeason}
                      onChange={(e) => setActiveSeason(Number(e.target.value))}
                      className="pl-4 pr-8 py-2 bg-n-surface border border-n-divider rounded text-sm text-n-text cursor-pointer focus:outline-none appearance-none"
                    >
                      {content.seasons.map((s, i) => (
                        <option key={s.id} value={i}>Season {s.number}</option>
                      ))}
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-n-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {currentSeason?.episodes.map((ep) => (
                  <Link
                    key={ep.id}
                    href={`/watch/${content.slug}?episode=${ep.id}`}
                    className="flex items-start gap-4 p-4 bg-n-surface hover:bg-n-raised border border-n-divider rounded-lg transition-colors group"
                  >
                    {/* Episode thumbnail */}
                    <div className="flex-shrink-0 w-32 h-18 rounded overflow-hidden bg-n-raised relative">
                      {ep.thumbnailUrl
                        ? <img src={ep.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center bg-n-divider"><svg className="w-8 h-8 fill-n-muted" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div>
                      }
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                    {/* Episode info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-n-muted text-sm font-medium">{ep.number}.</span>
                        <p className="font-semibold text-n-white truncate">{ep.title}</p>
                        <span className="text-n-muted text-xs ml-auto flex-shrink-0">{ep.duration}m</span>
                      </div>
                      {ep.description && (
                        <p className="text-xs text-n-muted line-clamp-2">{ep.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
