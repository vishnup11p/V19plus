import api from './axios';
import { Content } from './content';

export const searchApi = {
  search: (q: string) => api.get<{ results: Content[]; query: string; total: number }>('/search', { params: { q } }),
  suggestions: (q: string) =>
    api.get<{ title: string; slug: string; thumbnailUrl: string; type: string }[]>('/search/suggestions', { params: { q } }),
  trending: () => api.get<string[]>('/search/trending'),
  person: (name: string) => api.get<{ person: { name: string; photoUrl?: string; roles: string[] } | null; items: Content[] }>(`/search/person/${encodeURIComponent(name)}`),
};
