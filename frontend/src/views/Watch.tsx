import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useContent } from '../hooks/useContent';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { Skeleton } from '../components/ui/Skeleton';
import { historyApi } from '../api/history';
import { useAuthStore } from '../store/authStore';

export function Watch() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const episodeId = searchParams.get('episode') || undefined;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
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
    return <Skeleton className="h-screen w-full" />;
  }

  const allEpisodes = content.seasons?.flatMap((s) => s.episodes) || [];
  const currentIndex = allEpisodes.findIndex((e) => e.id === episodeId);

  const handleNextEpisode = () => {
    if (currentIndex >= 0 && currentIndex < allEpisodes.length - 1) {
      const next = allEpisodes[currentIndex + 1];
      navigate(`/watch/${slug}?episode=${next.id}`, { replace: true });
    }
  };

  const totalSeconds = (() => {
    const ep = allEpisodes.find((e) => e.id === episodeId);
    const mins = ep?.duration || content.duration || 0;
    return mins * 60;
  })();

  const resumeSeconds = savedProgress && !savedProgress.completed && savedProgress.progress > 0
    ? (savedProgress.progress / 100) * totalSeconds
    : 0;

  return (
    <VideoPlayer
      content={content}
      episodeId={episodeId}
      initialResumeSeconds={resumeSeconds}
      onNextEpisode={currentIndex >= 0 && currentIndex < allEpisodes.length - 1 ? handleNextEpisode : undefined}
    />
  );
}
