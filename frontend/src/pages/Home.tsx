import { HeroBanner } from '../components/content/HeroBanner';
import { GenreBar } from '../components/content/GenreBar';
import { ContentRow } from '../components/content/ContentRow';
import { ProfilePicker } from '../components/auth/ProfilePicker';
import {
  useFeatured, useTrending, useOriginals,
  useContinueWatching, useRecommended, useBrowse, useNewReleases,
  useBecauseYouWatched,
} from '../hooks/useContent';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { Landing } from './Landing';

export function Home() {
  const { data: featured, isLoading: featuredLoading } = useFeatured();
  const { data: trending, isLoading: trendingLoading } = useTrending();
  const { data: originals, isLoading: originalsLoading } = useOriginals();
  const { data: newReleases, isLoading: newReleasesLoading } = useNewReleases();
  const { data: continueWatching, isLoading: continueLoading } = useContinueWatching();
  const { data: recommended, isLoading: recommendedLoading } = useRecommended();
  const { data: becauseYouWatched, isLoading: becauseLoading } = useBecauseYouWatched();
  const { isAuthenticated, isLoading, activeProfile, setActiveProfile } = useAuthStore();
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

  // Show profile picker until a profile is selected
  if (!activeProfile) {
    return <ProfilePicker onSelect={() => {}} />;
  }

  const heroContent = featured?.[0];

  const continueItems = continueWatching?.map((h) => ({
    content: h.content,
    progress: h.progress,
  }));

  // T1-5: Top 10 — take first 10 of trending
  const top10 = trending?.slice(0, 10);
  // Award winners for non-kids profiles
  const topRated = activeProfile.isKids
    ? []
    : trending?.filter((c) => (c.imdbScore || 0) >= 8.0);

  // T1-2: kids mode — filter content
  const filteredOriginals = activeProfile.isKids
    ? originals?.filter((c) => ['G', 'PG', 'U', 'U/A 7+'].includes(c.rating))
    : originals;
  const filteredRecommended = activeProfile.isKids
    ? recommended?.filter((c) => ['G', 'PG', 'U', 'U/A 7+'].includes(c.rating))
    : recommended;
  const filteredNewReleases = activeProfile.isKids
    ? newReleases?.filter((c) => ['G', 'PG', 'U', 'U/A 7+'].includes(c.rating))
    : newReleases;

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

      {/* Because You Watched rows */}
      {isAuthenticated && becauseYouWatched && becauseYouWatched.map((row) => (
        <ContentRow
          key={row.seedId}
          title={`Because you watched ${row.seedTitle}`}
          items={row.items}
          isLoading={becauseLoading}
        />
      ))}

      {/* T1-5: Top 10 row with rank numbers */}
      <ContentRow
        title="Top 10 Today"
        items={top10}
        isLoading={trendingLoading}
        showRank
      />

      <ContentRow
        title="V19+ Originals"
        items={filteredOriginals}
        isLoading={originalsLoading}
      />

      {/* T1-4: New Releases row */}
      <ContentRow
        title="New on V19+"
        items={filteredNewReleases}
        isLoading={newReleasesLoading}
      />

      {isAuthenticated && (
        <ContentRow
          title="Recommended For You"
          items={filteredRecommended}
          isLoading={recommendedLoading}
        />
      )}

      {!activeProfile.isKids && topRated && topRated.length > 0 && (
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
