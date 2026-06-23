'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { useAuthInit } from '../hooks/useAuth';
import { normalizeGoogleClientId } from '../utils/googleClientId';

const googleClientId = normalizeGoogleClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '');

function AuthInitWrapper({ children }: { children: React.ReactNode }) {
  useAuthInit();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <AuthInitWrapper>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#1A1A1A', color: '#F5F5F0', border: '1px solid #2A2A28' },
            }}
          />
        </AuthInitWrapper>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
