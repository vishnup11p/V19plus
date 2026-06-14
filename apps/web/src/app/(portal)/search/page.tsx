'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, History, TrendingUp, SlidersHorizontal, X, ChevronDown, Search, Filter } from 'lucide-react';
import { searchApi } from '../../../api/search';
import { ContentCard } from '../../../components/content/ContentCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { Content } from '../../../api/content';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'SERIES', label: 'TV Shows' },
  { value: 'DOCUMENTARY', label: 'Docs' },
];

const TRENDING_TERMS = [
  'Action Thrillers',
  'V19Plus Originals',
  'Binge-worthy Series',
  'Oscar Winners',
  'Sci-Fi Favorites'
];

const GENRES = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller', 'Horror', 'Documentary'];
const YEARS = ['2026', '2025', '2024', '2023', '2022', 'Older'];
const RATINGS = ['8.0+ IMDb', '7.0+ IMDb', '6.0+ IMDb', 'All Ratings'];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<{ title: string; slug: string; thumbnailUrl: string; type: string }[]>([]);
  const [results, setResults] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Custom states
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Auto focus and load recent searches on mount
  useEffect(() => {
    inputRef.current?.focus();
    const stored = localStorage.getItem('v19_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Run initial search if query param exists
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  // Auto-suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await searchApi.suggestions(query);
        setSuggestions(data.slice(0, 6));
      } catch {
        setSuggestions([]);
      }
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

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const filtered = recentSearches.filter((t) => t.toLowerCase() !== term.toLowerCase());
    const updated = [term, ...filtered].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('v19_recent_searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('v19_recent_searches');
  };

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    setShowSuggestions(false);
    setLoading(true);
    saveRecentSearch(q);
    try {
      const { data } = await searchApi.search(q);
      setResults(data.results);
      
      const params = new URLSearchParams(window.location.search);
      params.set('q', q);
      router.replace(`/search?${params.toString()}`);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Simulate Voice Search
  const handleVoiceSearchClick = () => {
    setVoiceActive(true);
    // After 2s, select a random term and perform search
    setTimeout(() => {
      const randomTerm = TRENDING_TERMS[Math.floor(Math.random() * TRENDING_TERMS.length)];
      setQuery(randomTerm);
      setVoiceActive(false);
      performSearch(randomTerm);
    }, 2200);
  };

  // Dynamic filter pipeline
  const filtered = results.filter((item) => {
    // Type Filter
    if (typeFilter && item.type !== typeFilter) return false;
    
    // Genre Filter
    if (selectedGenre && !item.genre?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())) return false;
    
    // Year Filter
    if (selectedYear) {
      if (selectedYear === 'Older') {
        if (item.releaseYear >= 2022) return false;
      } else {
        if (item.releaseYear !== parseInt(selectedYear)) return false;
      }
    }

    // Rating Filter
    if (selectedRating) {
      const score = item.imdbScore || 0;
      if (selectedRating.includes('8.0') && score < 8) return false;
      if (selectedRating.includes('7.0') && score < 7) return false;
      if (selectedRating.includes('6.0') && score < 6) return false;
    }

    return true;
  });

  const hasSearched = results.length > 0 || (!!query && !loading);

  return (
    <div className="min-h-screen bg-n-bg pt-24 pb-16 animate-fade-in select-none">
      {/* Search Header Container */}
      <div className="px-4 md:px-12 mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-n-white mb-6">Search</h1>

        {/* Input bar */}
        <div className="relative max-w-2xl flex gap-3">
          <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-n-surface border border-n-divider rounded-2xl focus-within:border-n-red/50 transition-colors backdrop-blur-md">
            <Search className="w-5 h-5 text-n-muted flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') performSearch(query);
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              placeholder="Titles, genres, directors..."
              className="flex-1 bg-transparent text-n-text placeholder:text-n-muted text-base outline-none font-medium"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); setSuggestions([]); }}
                className="text-n-muted hover:text-n-white transition-colors"
                aria-label="Clear"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Voice Search Button */}
          <button
            onClick={handleVoiceSearchClick}
            className="w-14 h-14 bg-n-surface hover:bg-n-raised border border-n-divider hover:border-n-red/40 rounded-2xl flex items-center justify-center text-n-muted hover:text-n-red transition-all shadow-md active:scale-95"
            title="Voice Search"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`w-14 h-14 border rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
              showAdvancedFilters 
                ? 'bg-n-red/10 border-n-red text-n-red' 
                : 'bg-n-surface border-n-divider text-n-muted hover:border-white/25 hover:text-white'
            }`}
            title="Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-16 mt-2 bg-n-surface border border-n-divider rounded-2xl overflow-hidden shadow-netflix z-30"
            >
              {suggestions.map((s) => (
                <button
                  key={s.slug}
                  onClick={() => { setQuery(s.title); performSearch(s.title); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-n-raised transition-colors text-left"
                >
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-n-raised flex-shrink-0">
                    {s.thumbnailUrl && (
                      <img src={s.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-n-white">{s.title}</p>
                    <p className="text-xs text-n-muted capitalize">{s.type?.toLowerCase()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Collapsible Advanced Filters Section */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden max-w-2xl mt-4"
            >
              <div className="bg-n-surface/50 border border-n-divider rounded-2xl p-5 grid grid-cols-3 gap-4 backdrop-blur-sm">
                {/* Genre Selector */}
                <div className="space-y-1.5">
                  <label className="text-2xs text-gray-500 font-bold uppercase tracking-wider">Genre</label>
                  <div className="relative">
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-n-raised border border-n-divider rounded-xl text-xs text-white cursor-pointer focus:outline-none appearance-none focus:border-n-red/60"
                    >
                      <option value="">All Genres</option>
                      {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Year Selector */}
                <div className="space-y-1.5">
                  <label className="text-2xs text-gray-500 font-bold uppercase tracking-wider">Year</label>
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-n-raised border border-n-divider rounded-xl text-xs text-white cursor-pointer focus:outline-none appearance-none focus:border-n-red/60"
                    >
                      <option value="">All Years</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Rating Selector */}
                <div className="space-y-1.5">
                  <label className="text-2xs text-gray-500 font-bold uppercase tracking-wider">Rating</label>
                  <div className="relative">
                    <select
                      value={selectedRating}
                      onChange={(e) => setSelectedRating(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-n-raised border border-n-divider rounded-xl text-xs text-white cursor-pointer focus:outline-none appearance-none focus:border-n-red/60"
                    >
                      <option value="">All Ratings</option>
                      {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Type Filter Buttons */}
      {results.length > 0 && (
        <div className="px-4 md:px-12 mb-6 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${
                typeFilter === f.value
                  ? 'bg-n-red text-white border-n-red'
                  : 'bg-transparent text-n-text border-n-divider hover:border-n-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Results or Empty Previews */}
      <div className="px-4 md:px-12">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-md" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-n-muted mb-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
              {filtered.map((item) => (
                <ContentCard key={item.id} content={item} size="sm" />
              ))}
            </div>
          </>
        ) : hasSearched && query ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-n-white mb-2">No matches for "{query}"</h2>
            <p className="text-n-muted text-sm">Check your spelling, try tags, or explore trending items.</p>
          </div>
        ) : (
          /* Empty Search Previews (Trending and Recent Searches) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl pt-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-n-muted">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4" /> Recent Searches
                  </span>
                  <button onClick={clearRecentSearches} className="text-2xs hover:text-white transition-colors">Clear All</button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => { setQuery(term); performSearch(term); }}
                      className="w-full flex items-center justify-between px-4 py-3 bg-n-surface hover:bg-n-raised border border-n-divider rounded-xl text-left text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      <span>{term}</span>
                      <ChevronDown className="-rotate-90 w-3.5 h-3.5 text-gray-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Categories */}
            <div className="space-y-4">
              <span className="text-xs text-n-muted font-bold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Trending Searches
              </span>
              <div className="flex flex-wrap gap-2.5">
                {TRENDING_TERMS.map((term) => (
                  <button
                    key={term}
                    onClick={() => { setQuery(term); performSearch(term); }}
                    className="px-4 py-2.5 bg-n-surface hover:bg-n-raised border border-n-divider hover:border-n-red/40 rounded-xl text-xs text-gray-300 hover:text-white font-semibold transition-all flex items-center gap-1.5"
                  >
                    <span>{term}</span>
                    <Search className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Voice Search Simulated Overlay ── */}
      <AnimatePresence>
        {voiceActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-md"
          >
            <div className="text-center space-y-6">
              {/* Mic Icon with pulse waves */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full bg-n-red/20"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full bg-n-red/30"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                />
                <div className="w-16 h-16 rounded-full bg-n-red border border-orange-500/50 flex items-center justify-center text-white relative z-10 shadow-lg shadow-orange-500/40">
                  <Mic className="w-7 h-7" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Listening...</h3>
                <p className="text-sm text-gray-400">Say movie title, genre, or cast member</p>
              </div>

              {/* Sound wave bar indicator */}
              <div className="flex justify-center gap-1 h-6 items-end">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <motion.div
                    key={bar}
                    className="w-1 bg-n-red rounded-full"
                    animate={{ height: [4, 24, 4] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: bar * 0.1
                    }}
                    style={{ height: 4 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-n-bg pt-24 pb-16" />}>
      <SearchContent />
    </Suspense>
  );
}
