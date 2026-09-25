'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useContent } from '../../../../hooks/useContent';
import dynamic from 'next/dynamic';
import { Skeleton } from '../../../../components/ui/Skeleton';

const VideoPlayer = dynamic(() => import('../../../../components/player/VideoPlayer').then(mod => mod.VideoPlayer), {
  loading: () => <Skeleton className="h-screen w-full" />,
  ssr: false, // The video player relies heavily on browser APIs (hls.js, HTML5 Video)
});
import { historyApi } from '../../../../api/history';
import { useAuthStore } from '../../../../store/authStore';

export default function WatchPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const episodeId = searchParams.get('episode') || undefined;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: content, isLoading } = useContent(slug || '');

  const { data: savedProgress } = useQuery({
    queryKey: ['watch-progress', content?.id, episodeId],
    queryFn: async () => {
      if (!content?.id) return null;
      const { data } = await historyApi.getProgress(content.id, episodeId);
      return data;
    },
    enabled: !!content?.id && isAuthenticated,
  });

  if (isLoading || !content) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          <span className="text-white/50 text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  const allEpisodes = content.seasons?.flatMap((s) => s.episodes) || [];
  const currentIndex = allEpisodes.findIndex((e) => e.id === episodeId);

  const handleNextEpisode = () => {
    if (currentIndex >= 0 && currentIndex < allEpisodes.length - 1) {
      const next = allEpisodes[currentIndex + 1];
      // Use window.history for client-side route replacement without full reload
      window.history.replaceState(null, '', `/watch/${slug}?episode=${next.id}`);
      window.location.reload();
    }
  };

  const totalSeconds = (() => {
    const ep = allEpisodes.find((e) => e.id === episodeId);
    const mins = ep?.duration || content.duration || 0;
    return mins * 60;
  })();

  const resumeSeconds =
    savedProgress && !savedProgress.completed && savedProgress.progress > 0
      ? (savedProgress.progress / 100) * totalSeconds
      : 0;

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      <VideoPlayer
        content={content}
        episodeId={episodeId}
        initialResumeSeconds={resumeSeconds}
        onNextEpisode={
          currentIndex >= 0 && currentIndex < allEpisodes.length - 1
            ? handleNextEpisode
            : undefined
        }
      />
    </div>
  );
}
