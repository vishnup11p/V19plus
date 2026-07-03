import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlistApi } from '../api/watchlist';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import type { Content } from '../api/content';

export interface WatchlistItem {
  id: string;
  contentId: string;
  content: Content;
  addedAt: string;
}

export function useWatchlist() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s: any) => s.isAuthenticated);

  const { data: watchlist = [], isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data } = await watchlistApi.getAll();
      return data;
    },
    enabled: isAuthenticated,
  });

  const addMutation = useMutation({
    mutationFn: (contentId: string) => watchlistApi.add(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Could not add to My List';
      toast.error(msg);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (contentId: string) => watchlistApi.remove(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Could not remove from My List';
      toast.error(msg);
    },
  });

  const inList = (contentId: string) => {
    if (!isAuthenticated) return false;
    return watchlist.some((item: any) => item.contentId === contentId);
  };

  return {
    watchlist,
    isLoading,
    inList,
    add: addMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
