import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchApi } from '../api/search';
import { ContentCard } from '../components/content/ContentCard';
import { Content } from '../api/content';
import { Skeleton } from '../components/ui/Skeleton';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'SERIES', label: 'TV Shows' },
  { value: 'DOCUMENTARY', label: 'Docs' },
];

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<{ title: string; slug: string; thumbnailUrl: string; type: string }[]>([]);
  const [results, setResults] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Auto focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Run initial search if query param exists
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); performSearch(q); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-suggestions
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await searchApi.suggestions(query);
        setSuggestions(data.slice(0, 6));
      } catch { setSuggestions([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    setShowSuggestions(false);
    setLoading(true);
    try {
      const { data } = await searchApi.search(q);
      setResults(data.results);
      setSearchParams({ q });
    } finally {
      setLoading(false);
    }
  };

  const filtered = typeFilter ? results.filter((r) => r.type === typeFilter) : results;
  const hasSearched = results.length > 0 || (!!query && !loading);

  return (
    <div className="min-h-screen bg-n-bg pt-24 pb-16 animate-fade-in">
      {/* Header */}
      <div className="px-4 md:px-12 mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-n-white mb-6">Search</h1>

        {/* Search input */}
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-3 px-5 py-4 bg-n-surface border border-n-divider rounded-xl focus-within:border-n-white/50 transition-colors">
            <svg className="w-5 h-5 text-n-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') performSearch(query);
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              placeholder="Search titles, genres, actors..."
              className="flex-1 bg-transparent text-n-text placeholder:text-n-muted text-base outline-none"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); setSuggestions([]); }}
                className="text-n-muted hover:text-n-white transition-colors"
                aria-label="Clear"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-2 bg-n-surface border border-n-divider rounded-xl overflow-hidden shadow-netflix z-20"
            >
              {suggestions.map((s) => (
                <button
                  key={s.slug}
                  onClick={() => { setQuery(s.title); performSearch(s.title); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-n-raised transition-colors text-left"
                >
                  <div className="w-10 h-14 rounded overflow-hidden bg-n-raised flex-shrink-0">
                    {s.thumbnailUrl && (
                      <img src={s.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-n-white">{s.title}</p>
                    <p className="text-xs text-n-muted capitalize">{s.type?.toLowerCase()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Type filter */}
      {results.length > 0 && (
        <div className="px-4 md:px-12 mb-6 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                typeFilter === f.value
                  ? 'bg-n-white text-n-black border-n-white'
                  : 'bg-transparent text-n-text border-n-divider hover:border-n-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="px-4 md:px-12">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-md" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-n-muted mb-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
              {filtered.map((item) => (
                <ContentCard key={item.id} content={item} size="sm" />
              ))}
            </div>
          </>
        ) : hasSearched && query ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-n-white mb-2">No results for "{query}"</h2>
            <p className="text-n-muted">Try different keywords or browse our library</p>
          </div>
        ) : !query ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-xl font-bold text-n-white mb-2">Find your next watch</p>
            <p className="text-n-muted">Search for movies, shows, and documentaries</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
