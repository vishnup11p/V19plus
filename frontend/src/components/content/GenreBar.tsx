import { useRef } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useCategories } from '../../hooks/useSiteSettings';
import { TiltCard } from '../ui/TiltCard';

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
      className="flex gap-4 overflow-x-auto px-4 md:px-12 py-6 scrollbar-hide perspective-1000 items-center"
    >
      <TiltCard depth={5}>
        <button
          onClick={() => setActiveGenre(null)}
          className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all border ${
            !activeGenre
              ? 'bg-v-orange text-white border-v-orange shadow-orange-glow transform scale-105'
              : 'bg-v-card/40 backdrop-blur-md text-v-muted border-white/10 hover:border-v-orange/50 hover:text-white'
          }`}
        >
          All Data
        </button>
      </TiltCard>
      
      <div className="w-px h-6 bg-white/10 mx-2 flex-shrink-0" />

      {genres.map((genre) => (
        <TiltCard key={genre} depth={5}>
          <button
            onClick={() => setActiveGenre(genre === activeGenre ? null : genre)}
            className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all border ${
              activeGenre === genre
                ? 'bg-v-orange text-white border-v-orange shadow-orange-glow transform scale-105'
                : 'bg-v-card/40 backdrop-blur-md text-v-muted border-white/10 hover:border-v-orange/50 hover:text-white'
            }`}
          >
            {genre}
          </button>
        </TiltCard>
      ))}
    </div>
  );
}
