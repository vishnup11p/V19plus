import { Providers } from '../components/Providers';
import '../index.css';

export const metadata = {
  title: 'V19+ | Stream Unlimited',
  description: 'Stream unlimited movies, TV shows, and documentaries.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'V19+',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#141414',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#141414] text-[#e5e5e5] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
