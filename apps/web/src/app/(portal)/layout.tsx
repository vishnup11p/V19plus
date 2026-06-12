'use client';

import React from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Footer } from '../../components/layout/Footer';
import { DetailModal } from '../../components/content/DetailModal';
import { SiteConfig } from '../../components/layout/SiteConfig';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-n-bg">
      <SiteConfig />
      <Topbar />
      <main className="flex-1 pt-0">
        {children}
      </main>
      <Footer />
      <DetailModal />
    </div>
  );
}
