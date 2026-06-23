export function normalizeGoogleClientId(id: string): string {
  const trimmed = (id || '').trim();
  if (!trimmed) return '';
  if (/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(trimmed)) return trimmed;
  return trimmed.replace(/^(\d+)([a-z0-9]+)(\.apps\.googleusercontent\.com)$/i, '$1-$2$3');
}

export function isValidGoogleClientIdFormat(id: string): boolean {
  return /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(normalizeGoogleClientId(id));
}
