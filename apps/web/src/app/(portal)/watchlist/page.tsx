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
          <div className="flex flex-col items-center justify-center py-28 text-center bg-n-surface/20 border border-n-divider/50 rounded-2xl p-8 max-w-xl mx-auto">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-xl font-bold text-n-white mb-2">Your list is empty</h2>
            <p className="text-n-muted mb-6 max-w-sm">
              Explore trending shows and films to add them to your collection.
            </p>
            <button
              onClick={() => router.push('/browse')}
              className="px-6 py-2.5 bg-n-white text-black font-bold rounded-lg hover:bg-n-white/90 transition-all active:scale-95 text-sm"
            >
              Browse Titles
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
