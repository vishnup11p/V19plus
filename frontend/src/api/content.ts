import api from './axios';

export interface Content {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  genre: string[];
  tags: string[];
  releaseYear: number;
  rating: string;
  imdbScore?: number;
  duration?: number;
  thumbnailUrl: string;
  backdropUrl: string;
  videoUrl?: string;
  trailerUrl?: string;
  isOriginal: boolean;
  isFeatured: boolean;
  cast?: { id: string; name: string; role: string; photoUrl?: string }[];
  seasons?: {
    id: string;
    number: number;
    title?: string;
    episodes: {
      id: string;
      number: number;
      title: string;
      description?: string;
      duration: number;
      thumbnailUrl?: string;
      videoUrl: string;
      introStart?: number;
      introEnd?: number;
    }[];
  }[];
  watchProgress?: { progress: number; completed: boolean; episodeId?: string };
}

export interface WatchHistoryItem {
  id: string;
  progress: number;
  completed: boolean;
  content: Content;
  episode?: { id: string; number: number; title: string };
}

export const contentApi = {
  list: (params?: { type?: string; genre?: string; page?: number; limit?: number }) =>
    api.get('/content', { params }),
  featured: () => api.get<Content[]>('/content/featured'),
  trending: () => api.get<Content[]>('/content/trending'),
  originals: () => api.get<Content[]>('/content/originals'),
  newReleases: () => api.get<Content[]>('/content/new-releases'),
  continueWatching: () => api.get<WatchHistoryItem[]>('/content/continue-watching'),
  recommended: () => api.get<Content[]>('/content/recommended'),
  becauseYouWatched: () => api.get<{ seedTitle: string; seedId: string; items: Content[] }[]>('/content/because-you-watched'),
  similar: (id: string) => api.get<Content[]>(`/content/id/${id}/similar`),
  matchScores: (ids: string[]) => api.get<Record<string, number>>('/content/match-scores', { params: { ids: ids.join(',') } }),
  getBySlug: (slug: string) => api.get<Content>(`/content/${slug}`),
};
