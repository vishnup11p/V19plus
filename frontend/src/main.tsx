import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { useAuthInit } from './hooks/useAuth';
import { normalizeGoogleClientId } from './utils/googleClientId';
import './index.css';

const googleClientId = normalizeGoogleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AppWrapper() {
  useAuthInit();
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppWrapper />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#1A1A1A', color: '#F5F5F0', border: '1px solid #2A2A28' },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
