import { useState } from 'react';
import { useBrowse } from '../hooks/useContent';
import { ContentCard } from '../components/content/ContentCard';
import { Skeleton } from '../components/ui/Skeleton';
import type { Content } from '../api/content';

const TYPES = [
  { value: '', label: 'All' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'SERIES', label: 'TV Shows' },
  { value: 'DOCUMENTARY', label: 'Documentaries' },
  { value: 'SHORT', label: 'Shorts' },
];

const GENRES = [
  '', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery',
  'Romance', 'Sci-Fi', 'Thriller',
];

export function Browse() {
  const [type, setType] = useState('');
  const [genre, setGenre] = useState('');
  const { data, isLoading } = useBrowse(type || undefined, genre || undefined);
  const items: Content[] = data?.items || [];

  return (
    <div className="min-h-screen bg-n-bg pt-24 pb-16 animate-fade-in">
      {/* Header */}
      <div className="px-4 md:px-12 mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-n-white mb-2">Browse</h1>
        <p className="text-n-muted">Explore our full library</p>
      </div>

      {/* Filters */}
      <div className="px-4 md:px-12 mb-8 flex flex-wrap gap-3">
        {/* Type pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                type === t.value
                  ? 'bg-n-white text-n-black border-n-white'
                  : 'bg-transparent text-n-text border-n-divider hover:border-n-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Genre dropdown */}
        <div className="relative">
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="pl-4 pr-8 py-2 bg-n-surface border border-n-divider rounded-full text-sm text-n-text cursor-pointer focus:outline-none focus:border-n-text appearance-none"
          >
            <option value="">All Genres</option>
            {GENRES.filter(Boolean).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-n-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Result count */}
      {!isLoading && items.length > 0 && (
        <div className="px-4 md:px-12 mb-4">
          <p className="text-sm text-n-muted">{items.length} titles</p>
        </div>
      )}

      {/* Grid */}
      <div className="px-4 md:px-12">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
            {Array.from({ length: 21 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-md" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
            {items.map((item) => (
              <ContentCard key={item.id} content={item} size="sm" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-bold text-n-white mb-2">No results found</h2>
            <p className="text-n-muted">Try adjusting the filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
