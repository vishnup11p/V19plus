import { Providers } from '../components/Providers';
import '../index.css';

export const metadata = {
  title: 'V19Plus | Stream Unlimited',
  description: 'Stream unlimited movies, TV shows, and documentaries.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'V19Plus',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
