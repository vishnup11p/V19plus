'use client';

import { useWatchlist } from '../../../hooks/useWatchlist';
import { ContentCard } from '../../../components/content/ContentCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WatchlistPage() {
  const { data: watchlist, isLoading } = useWatchlist();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-n-bg pt-24 pb-16 animate-fade-in">
        <div className="px-4 md:px-12 mb-8">
          <Skeleton className="h-10 w-48 rounded mb-2" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <div className="px-4 md:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const items = watchlist || [];

  return (
    <div className="min-h-screen bg-n-bg pt-24 pb-16 animate-fade-in animate-fade-up">
      {/* Header */}
      <div className="px-4 md:px-12 mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-n-white mb-2">My List</h1>
        <p className="text-n-muted">Titles you've saved to watch</p>
      </div>

      {/* Grid */}
      <div className="px-4 md:px-12">
        {items.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
            {items.map((item: any) => (
              <ContentCard key={item.id} content={item.content} size="sm" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 border border-white/10 rounded-3xl p-8 max-w-lg mx-auto shadow-xl backdrop-blur-md">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-3xl mb-6 text-orange-500 animate-bounce">
              🎬
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Your list is waiting for stories</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-xs leading-relaxed">
              Don't worry, we have thousands of movies, series, and exclusives waiting. Let's find your next favorite together!
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all active:scale-95 text-sm shadow-md shadow-orange-900/20 hover:shadow-lg hover:shadow-orange-500/25"
            >
              Start Exploring
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
