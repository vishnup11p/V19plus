export function toJsonArray(values: string[]): string {
  return JSON.stringify(values);
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
    }
  }
  return [];
}

export function contentMatchesGenre(genre: unknown, target: string): boolean {
  return asStringArray(genre).some((g) => g.toLowerCase() === target.toLowerCase());
}

export function contentMatchesGenres(genre: unknown, targets: string[]): boolean {
  const genres = asStringArray(genre).map((g) => g.toLowerCase());
  return targets.some((t) => genres.includes(t.toLowerCase()));
}

export function contentMatchesTag(tags: unknown, query: string): boolean {
  const q = query.toLowerCase();
  return asStringArray(tags).some((t) => t.toLowerCase().includes(q));
}

export function historyEntryKey(contentId: string, episodeId?: string | null): string {
  return episodeId ? `${contentId}:${episodeId}` : contentId;
}

export function serializeContent<T extends { genre: unknown; tags: unknown }>(content: T) {
  return {
    ...content,
    genre: asStringArray(content.genre),
    tags: asStringArray(content.tags),
  };
}
