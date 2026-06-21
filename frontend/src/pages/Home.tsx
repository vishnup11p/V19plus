import { HeroBanner } from '../components/content/HeroBanner';
import { GenreBar } from '../components/content/GenreBar';
import { ContentRow } from '../components/content/ContentRow';
import {
  useFeatured, useTrending, useOriginals,
  useContinueWatching, useRecommended, useBrowse,
} from '../hooks/useContent';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { Landing } from './Landing';

export function Home() {
  const { data: featured, isLoading: featuredLoading } = useFeatured();
  const { data: trending, isLoading: trendingLoading } = useTrending();
  const { data: originals, isLoading: originalsLoading } = useOriginals();
  const { data: continueWatching, isLoading: continueLoading } = useContinueWatching();
  const { data: recommended, isLoading: recommendedLoading } = useRecommended();
  const { isAuthenticated, isLoading } = useAuthStore();
  const activeGenre = useUiStore((s) => s.activeGenre);
  const { data: genreContent, isLoading: genreLoading } = useBrowse(undefined, activeGenre || undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-n-black flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-n-divider border-t-n-red animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  const heroContent = featured?.[0];

  const continueItems = continueWatching?.map((h) => ({
    content: h.content,
    progress: h.progress,
  }));

  const topRated = trending?.filter((c) => (c.imdbScore || 0) >= 8.0);

  return (
    <div className="min-h-screen bg-n-bg animate-fade-in">
      {/* Hero */}
      <HeroBanner content={heroContent} isLoading={featuredLoading} />

      {/* Genre filter */}
      <div className="relative -mt-6 z-10 mb-2">
        <GenreBar />
      </div>

      {/* Content rows */}
      {activeGenre && (
        <ContentRow
          title={`${activeGenre} Picks`}
          items={genreContent?.items}
          isLoading={genreLoading}
        />
      )}

      {isAuthenticated && continueItems && continueItems.length > 0 && (
        <ContentRow
          title="Continue Watching"
          historyItems={continueItems}
          isLoading={continueLoading}
        />
      )}

      <ContentRow
        title="Trending Now"
        items={trending}
        isLoading={trendingLoading}
        showRank
      />

      <ContentRow
        title="V19+ Originals"
        items={originals}
        isLoading={originalsLoading}
      />

      {isAuthenticated && (
        <ContentRow
          title="Recommended For You"
          items={recommended}
          isLoading={recommendedLoading}
        />
      )}

      {topRated && topRated.length > 0 && (
        <ContentRow
          title="Award Winners"
          items={topRated}
          isLoading={trendingLoading}
        />
      )}

      {/* Extra rows from featured */}
      {featured && featured.length > 1 && (
        <ContentRow
          title="Featured Titles"
          items={featured.slice(1)}
          isLoading={featuredLoading}
        />
      )}
    </div>
  );
}
