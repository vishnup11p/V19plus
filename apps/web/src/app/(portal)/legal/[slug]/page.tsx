import React from 'react';

export default function LegalPage({ params }: { params: { slug: string } }) {
  const titles: Record<string, string> = {
    terms: 'Terms and Conditions',
    privacy: 'Privacy Policy',
    refund: 'Refund Policy',
    cookies: 'Cookie Policy',
  };

  const title = titles[params.slug] || 'Legal Document';

  return (
    <div className="min-h-screen bg-n-black text-n-text pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-[#111] border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-8 border-b border-white/10 pb-6">{title}</h1>
        <div className="prose prose-invert max-w-none text-n-text/90">
          <p className="mb-4">
            <em>This document serves as the master legal agreement for V19Plus.</em>
          </p>
          <p className="mb-4">
            Welcome to V19Plus. These {title} govern your use of our platform. We are currently finalizing the formatted integration of our legal documentation package. 
          </p>
          <p>
            Please check back shortly, or contact <a href="mailto:legal@v19plus.com" className="text-n-red hover:underline">legal@v19plus.com</a> if you have immediate inquiries regarding our policies, data protection, or service terms.
          </p>
        </div>
      </div>
    </div>
  );
}
