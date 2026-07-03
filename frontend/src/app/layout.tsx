import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "V19+ | Stream Unlimited Movies & Shows",
  description: "V19 Plus is a premium streaming platform featuring unlimited movies, series, originals, and documentaries with high-end Dolby surround sound and offline downloads.",
  icons: {
    icon: "/logo-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-v-black text-v-text antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
