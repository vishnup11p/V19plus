import { useRef } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useCategories } from '../../hooks/useSiteSettings';

const FALLBACK_GENRES = ['Action', 'Drama', 'Sci-Fi', 'Horror', 'Crime', 'Comedy', 'Thriller', 'Romance', 'Documentary'];

export function GenreBar() {
  const { activeGenre, setActiveGenre } = useUiStore();
  const { data: categories } = useCategories();
  const scrollRef = useRef<HTMLDivElement>(null);

  const genres = categories?.length
    ? categories.map((c) => c.name)
    : FALLBACK_GENRES;

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto px-4 md:px-12 py-4 scrollbar-hide"
    >
      <button
        onClick={() => setActiveGenre(null)}
        className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all border ${
          !activeGenre
            ? 'bg-n-white text-n-black border-n-white'
            : 'bg-transparent text-n-text border-n-divider hover:border-n-text'
        }`}
      >
        All
      </button>
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => setActiveGenre(genre === activeGenre ? null : genre)}
          className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all border ${
            activeGenre === genre
              ? 'bg-n-white text-n-black border-n-white'
              : 'bg-transparent text-n-text border-n-divider hover:border-n-text'
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
