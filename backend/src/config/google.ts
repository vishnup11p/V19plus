import { OAuth2Client } from 'google-auth-library';
import { normalizeGoogleClientId, isValidGoogleClientIdFormat } from '../utils/googleClientId';

let client: OAuth2Client | null = null;

export function getGoogleClientId(): string {
  return normalizeGoogleClientId(process.env.GOOGLE_CLIENT_ID || '');
}

export function getGoogleRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.FRONTEND_URL || 'http://localhost:5173'}/api/auth/google/callback`
  );
}

export function getGoogleClient(): OAuth2Client {
  const clientId = getGoogleClientId();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim() || undefined;
  const redirectUri = getGoogleRedirectUri();
  if (!client) {
    client = new OAuth2Client(clientId, clientSecret, redirectUri);
  }
  return client;
}

export function getGoogleAuthUrl(): string {
  return getGoogleClient().generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  });
}

export function getGoogleConfigStatus() {
  const clientId = getGoogleClientId();
  const hasSecret = !!(process.env.GOOGLE_CLIENT_SECRET || '').trim();
  return {
    configured: !!clientId && isValidGoogleClientIdFormat(clientId),
    clientIdPreview: clientId ? `${clientId.slice(0, 12)}...` : null,
    hasClientSecret: hasSecret,
    redirectUri: getGoogleRedirectUri(),
    formatValid: isValidGoogleClientIdFormat(clientId),
  };
}

export function resetGoogleClient(): void {
  client = null;
}
