import { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { normalizeGoogleClientId, isValidGoogleClientIdFormat } from '../../utils/googleClientId';
import toast from 'react-hot-toast';

const rawClientId = (typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID : '') || '';
const clientId = normalizeGoogleClientId(rawClientId);

export function GoogleSignInButton() {
  const { googleLogin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);
  const returnUrl = (location.state as { returnUrl?: string })?.returnUrl || '/';

  const { data: googleStatus } = useQuery({
    queryKey: ['google-status'],
    queryFn: async () => (await authApi.googleStatus()).data,
    staleTime: 60_000,
  });

  if (!clientId) {
    return <GoogleSetupHelp reason="NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in frontend/.env" />;
  }

  if (!isValidGoogleClientIdFormat(clientId)) {
    return (
      <GoogleSetupHelp reason="Client ID format looks invalid. Copy the full ID from Google Cloud Console." />
    );
  }

  const handleRedirectSignIn = async () => {
    setRedirecting(true);
    try {
      const { data } = await authApi.googleAuthUrl();
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not start Google sign-in. Add GOOGLE_CLIENT_SECRET to backend/.env';
      toast.error(msg);
      setRedirecting(false);
    }
  };

  const handleOneTapSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast.error('Google sign-in failed');
      return;
    }
    try {
      await googleLogin(response.credential);
      toast.success('Welcome! 🎉');
      navigate(returnUrl);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Google sign-in failed';
      toast.error(msg);
    }
  };

  const useRedirect = googleStatus?.hasClientSecret === true;

  return (
    <div className="w-full space-y-3">
      <div className="w-full flex justify-center [&>div]:w-full">
        <GoogleLogin
          onSuccess={handleOneTapSuccess}
          onError={() =>
            toast.error('Google sign-in failed — check OAuth client in Google Cloud Console')
          }
          theme="filled_black"
          shape="rectangular"
          text="continue_with"
          size="large"
          width="360"
        />
      </div>

      {!googleStatus?.hasClientSecret && (
        <p className="text-[11px] text-amber-400/80 text-center bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2 leading-relaxed">
          Add <code className="text-amber-300 font-mono">GOOGLE_CLIENT_SECRET</code> to{' '}
          <code className="text-amber-300 font-mono">backend/.env</code> for reliable sign-in
        </p>
      )}
    </div>
  );
}

function GoogleColorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.083 36 24 36c-5.514 0-10-4.486-10-10s4.486-10 10-10c2.837 0 5.402 1.192 7.207 3.093l5.657-5.657C33.64 10.053 29.082 8 24 8 12.955 8 4 16.955 4 28s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c2.837 0 5.402 1.192 7.207 3.093l5.657-5.657C33.64 10.053 29.082 8 24 8 16.318 8 9.656 13.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 48c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 39.091 26.715 40 24 40c-5.148 0-9.546-3.304-11.13-7.907l-6.52 5.025C9.505 43.99 16.227 48 24 48z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.194 8-11.303 8-5.514 0-10-4.486-10-10s4.486-10 10-10c2.837 0 5.402 1.192 7.207 3.093l5.657-5.657C33.64 10.053 29.082 8 24 8 12.955 8 4 16.955 4 28s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

export function GoogleSetupHelp({ reason }: { reason: string }) {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-5 text-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="text-amber-200 font-semibold text-sm">Google Sign-In not configured</p>
          <p className="text-v-muted text-xs mt-0.5">{reason}</p>
        </div>
      </div>
      <ol className="text-xs text-v-muted space-y-2.5 list-decimal list-inside pl-1">
        <li>
          Open{' '}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="text-v-orange hover:text-v-orange-light underline underline-offset-2 transition-colors"
          >
            Google Cloud Console → Credentials
          </a>
        </li>
        <li>
          Create <strong className="text-v-text">OAuth 2.0 Client ID</strong> → type{' '}
          <strong className="text-v-text">Web application</strong>
        </li>
        <li>
          Authorized JavaScript origins:{' '}
          <code className="text-v-text bg-v-raised px-1.5 py-0.5 rounded text-[11px]">
            http://localhost:5173
          </code>
        </li>
        <li>
          Authorized redirect URIs:{' '}
          <code className="text-v-text bg-v-raised px-1.5 py-0.5 rounded text-[11px]">
            http://localhost:4000/api/auth/google/callback
          </code>
        </li>
        <li>
          Copy <strong className="text-v-text">Client ID</strong> → add to{' '}
          <code className="text-v-text bg-v-raised px-1.5 py-0.5 rounded text-[11px]">
            frontend/.env
          </code>{' '}
          and{' '}
          <code className="text-v-text bg-v-raised px-1.5 py-0.5 rounded text-[11px]">
            backend/.env
          </code>
        </li>
        <li>
          Copy <strong className="text-v-text">Client Secret</strong> → add to{' '}
          <code className="text-v-text bg-v-raised px-1.5 py-0.5 rounded text-[11px]">
            backend/.env
          </code>{' '}
          as{' '}
          <code className="text-v-text bg-v-raised px-1.5 py-0.5 rounded text-[11px]">
            GOOGLE_CLIENT_SECRET
          </code>
        </li>
        <li>Restart the dev server</li>
      </ol>
    </div>
  );
}
