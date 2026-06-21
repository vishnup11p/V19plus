'use client';

import dynamic from 'next/dynamic';
import { BrowserRouter } from 'react-router-dom';

const App = dynamic(() => import('../../App'), { ssr: false });

export default function CatchAllPage() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
