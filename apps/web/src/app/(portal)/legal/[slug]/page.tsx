import React from 'react';

export default function LegalPage({ params }: { params: { slug: string } }) {
  const titles: Record<string, string> = {
    terms: 'Terms and Conditions',
    privacy: 'Privacy Policy',
    refund: 'Refund Policy',
    cookies: 'Cookie Policy',
    'delete-account': 'Account Deletion Request',
  };

  const title = titles[params.slug] || 'Legal Document';
  const isDeleteAccount = params.slug === 'delete-account';

  return (
    <div className="min-h-screen bg-n-black text-n-text pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-[#111] border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-8 border-b border-white/10 pb-6">{title}</h1>
        <div className="prose prose-invert max-w-none text-n-text/90">
          {isDeleteAccount ? (
            <>
              <p className="mb-6 leading-relaxed">
                At <strong>V19Plus</strong>, we value your privacy and give you full control over your personal data. You can request the deletion of your account and all associated data at any time.
              </p>
              <h2 className="text-xl font-bold text-white mb-4">How to Request Deletion:</h2>
              <ol className="list-decimal list-inside space-y-3 mb-6">
                <li>Send an email to our support team at <a href="mailto:support@v19plus.com" className="text-n-red hover:underline font-semibold">support@v19plus.com</a>.</li>
                <li>Use the subject line: <strong>"Account Deletion Request - V19Plus"</strong>.</li>
                <li>Provide your registered account email address.</li>
              </ol>
              <h2 className="text-xl font-bold text-white mb-4">Data Deletion Details:</h2>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li><strong>What is deleted:</strong> Your email address, profile names, watchlist items, watch history logs, and subscription metadata will be permanently deleted from our active database.</li>
                <li><strong>Retention period:</strong> Upon receiving your request, our support team will verify your identity and process the deletion within <strong>7 business days</strong>. Backup logs may take up to 30 days to be fully cleared.</li>
              </ul>
            </>
          ) : (
            <>
              <p className="mb-4">
                <em>This document serves as the master legal agreement for V19Plus.</em>
              </p>
              <p className="mb-4">
                Welcome to V19Plus. These {title} govern your use of our platform. We are currently finalizing the formatted integration of our legal documentation package. 
              </p>
              <p>
                Please check back shortly, or contact <a href="mailto:legal@v19plus.com" className="text-n-red hover:underline">legal@v19plus.com</a> if you have immediate inquiries regarding our policies, data protection, or service terms.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
