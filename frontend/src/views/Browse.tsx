import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrowse } from '../hooks/useContent';
import { Link } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import type { Content } from '../api/content';

const TYPES = [
  { value: '', label: 'All' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'SERIES', label: 'Series' },
  { value: 'LIVE', label: 'Live TV' },
  { value: 'ORIGINALS', label: 'Originals' },
];

export function Browse() {
  const [type, setType] = useState('');
  const { data, isLoading } = useBrowse(
    type === 'ORIGINALS' ? undefined : (type || undefined),
    undefined
  );
  const navigate = useNavigate();

  let items: Content[] = data?.items || [];
  if (type === 'ORIGINALS') {
    items = items.filter(item => item.isOriginal);
  }

  // Get nice, beautiful gradient backgrounds matching the UI mockup pictures
  const getGradientClass = (index: number) => {
    const gradients = [
      'from-[#b45309] via-[#78350f] to-[#0A0806]', // Orange/Brown
      'from-[#0f766e] via-[#042f2e] to-[#0A0806]', // Teal
      'from-[#6b21a8] via-[#4c1d95] to-[#0A0806]', // Purple
      'from-[#854d0e] via-[#422006] to-[#0A0806]', // Yellow/Olive
      'from-[#065f46] via-[#064e3b] to-[#0A0806]', // Green
      'from-[#991b1b] via-[#450a0a] to-[#0A0806]', // Crimson Red
      'from-[#3730a3] via-[#1e1b4b] to-[#0A0806]', // Blue/Indigo
      'from-[#7c2d12] via-[#431407] to-[#0A0806]', // Dark Orange
      'from-[#1e3a8a] via-[#172554] to-[#0A0806]', // Deep Blue
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="min-h-screen bg-n-bg pt-20 pb-24 px-4 md:px-12 animate-fade-in relative">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-[#FAF6EF]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Browse</h1>
        <button
          onClick={() => navigate('/search')}
          className="w-10 h-10 rounded-full bg-[#181410] border border-white/5 flex items-center justify-center text-[#8C8478] hover:text-white transition-colors"
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Pill Filters */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide mb-8">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${
              type === t.value
                ? 'bg-[#FF5C00] text-black shadow-lg shadow-[#FF5C00]/25'
                : 'bg-[#181410] text-[#FAF6EF] border border-white/5 hover:border-white/20'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid - 3 columns for mobile/tablet, 4 for md, 5 for lg */}
      {isLoading ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {items.map((item, index) => (
            <Link
              key={item.id}
              to={`/title/${item.slug}`}
              className="block group relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 hover:border-[#FF5C00]/40 transition-all duration-300"
            >
              {/* Gradient card content */}
              <div className={`absolute inset-0 bg-gradient-to-b ${getGradientClass(index)} p-4 flex flex-col justify-end`}>
                {item.thumbnailUrl && (
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity group-hover:scale-105 group-hover:opacity-30 transition-all duration-500"
                    loading="lazy"
                  />
                )}
                {/* Title */}
                <h3 className="font-extrabold text-sm md:text-base text-[#FAF6EF] leading-tight group-hover:text-[#FF5C00] transition-colors relative z-10">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-xl font-bold text-n-white mb-2">No items found</h2>
          <p className="text-[#8C8478] text-sm">Please check back later</p>
        </div>
      )}
    </div>
  );
}
