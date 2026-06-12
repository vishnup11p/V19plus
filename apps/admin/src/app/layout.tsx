import { Providers } from '../components/Providers';
import '../globals.css';

export const metadata = {
  title: 'V19+ Admin',
  description: 'Admin panel for V19+ OTT platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5] antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
