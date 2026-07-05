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
  const slug = params.slug;

  const renderContent = () => {
    switch (slug) {
      case 'delete-account':
        return (
          <>
            <p className="mb-6 leading-relaxed">
              At <strong>V19Plus</strong>, we value your privacy and give you full control over your personal data. You can request the deletion of your account and all associated data at any time.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">How to Request Deletion:</h2>
            <ol className="list-decimal list-inside space-y-3 mb-6">
              <li>Send an email to our support team at <a href="mailto:support@v19plus.app" className="text-n-red hover:underline font-semibold">support@v19plus.app</a>.</li>
              <li>Use the subject line: <strong>"Account Deletion Request - V19Plus"</strong>.</li>
              <li>Provide your registered account email address.</li>
            </ol>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">Data Deletion Details:</h2>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li><strong>What is deleted:</strong> Your email address, profile names, watchlist items, watch history logs, and subscription metadata will be permanently deleted from our active database.</li>
              <li><strong>Retention period:</strong> Upon receiving your request, our support team will verify your identity and process the deletion within <strong>7 business days</strong>. Backup logs may take up to 30 days to be fully cleared.</li>
            </ul>
          </>
        );
      case 'privacy':
        return (
          <>
            <p className="mb-4"><strong>Effective Date: July 5, 2026</strong></p>
            <p className="mb-6 leading-relaxed">
              V19Plus ("we", "us", or "our") operates the V19Plus movie and TV show streaming service. This Privacy Policy details how we collect, use, disclose, and protect your information when you visit our website or use our Android mobile application.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">1. Information Collection</h2>
            <p className="mb-4 leading-relaxed">
              We collect information that you provide directly to us when creating an account, editing your profile, or contacting support. This includes your name, email address, password, and profile preferences. We also automatically collect usage metrics, such as your watch history, watchlist selections, IP address, and device type.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">2. How We Use Your Information</h2>
            <p className="mb-4 leading-relaxed">
              We use your data to deliver the streaming service, manage your user profile, maintain system security, personalize recommendations, send service alerts, and improve overall app functionality.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">3. Third-Party Service Providers</h2>
            <p className="mb-4 leading-relaxed">
              We work with trusted third-party providers to operate our infrastructure:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li><strong>Firebase:</strong> Used for push notifications, application configurations, and analytics.</li>
              <li><strong>Supabase:</strong> Serves as our primary relational database and user storage repository.</li>
              <li><strong>Stripe:</strong> Processes payment details securely (no payment info is stored on our servers).</li>
            </ul>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">4. Your Data Rights</h2>
            <p className="mb-4 leading-relaxed">
              You have the right to access, update, or request the permanent deletion of your personal data. To delete your account data, please visit the Account Settings menu or contact us at <a href="mailto:support@v19plus.app" className="text-n-red hover:underline">support@v19plus.app</a>.
            </p>
          </>
        );
      case 'terms':
        return (
          <>
            <p className="mb-4"><strong>Last Updated: July 5, 2026</strong></p>
            <p className="mb-6 leading-relaxed">
              These Terms and Conditions govern your access to and use of the V19Plus streaming platform. By accessing or using V19Plus, you agree to be bound by these Terms.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">1. Eligibility and Accounts</h2>
            <p className="mb-4 leading-relaxed">
              You must be at least 18 years old, or the age of majority in your jurisdiction, to register for a V19Plus account. You are solely responsible for protecting your account credentials and maintaining control over the devices used to access the service.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">2. Content Licensing</h2>
            <p className="mb-4 leading-relaxed">
              The content available on V19Plus is for personal, non-commercial use only. We grant you a limited, non-exclusive, non-transferable license to access V19Plus content and stream movies, TV shows, and documentaries. Any unauthorized copying, distribution, or public performance of our content is strictly prohibited.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">3. Acceptable Use and Safety</h2>
            <p className="mb-4 leading-relaxed">
              You agree not to bypass, disable, or tamper with any content protection mechanisms or digital rights management (DRM) technologies on the platform. You may not use automated bots to scrape content or compromise the security of our backend services.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">4. Limitation of Liability</h2>
            <p className="mb-4 leading-relaxed">
              V19Plus is provided on an "as-is" and "as-available" basis. We make no guarantees that streaming services will be uninterrupted or error-free. To the fullest extent permitted by law, V19Plus shall not be held liable for any indirect, incidental, or consequential damages resulting from your use of the service.
            </p>
          </>
        );
      case 'refund':
        return (
          <>
            <p className="mb-4"><strong>Effective Date: July 5, 2026</strong></p>
            <p className="mb-6 leading-relaxed">
              This Refund Policy applies to any billing or paid tiers introduced on the V19Plus platform.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">1. Subscription Plans</h2>
            <p className="mb-4 leading-relaxed">
              V19Plus currently operates on a free-to-use tier. In the event that V19Plus introduces paid subscription tiers, the payment details, cancellation mechanisms, and refund eligibilities outlined below will apply.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">2. Non-Refundable Payments</h2>
            <p className="mb-4 leading-relaxed">
              All subscription charges, transaction fees, and payments processed through Stripe are non-refundable. We do not provide refunds or credits for any partial-month subscription periods or unwatched content.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">3. Cancellations</h2>
            <p className="mb-4 leading-relaxed">
              You may cancel your paid subscription at any time. Your access to paid content tiers will continue through the end of your current active billing cycle. To cancel your plan, go to your Account Settings and manage your subscription.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">4. Exceptions</h2>
            <p className="mb-4 leading-relaxed">
              If a system error, double-billing event, or technical failure occurs directly attributable to V19Plus, our support team will investigate the issue. Refund exceptions may be evaluated on a case-by-case basis. Please email support at <a href="mailto:billing@v19plus.app" className="text-n-red hover:underline">billing@v19plus.app</a> for billing assistance.
            </p>
          </>
        );
      case 'cookies':
        return (
          <>
            <p className="mb-4"><strong>Effective Date: July 5, 2026</strong></p>
            <p className="mb-6 leading-relaxed">
              This Cookie Policy explains how V19Plus uses cookies and similar tracking technologies to customize and improve your streaming experience.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">1. What are Cookies?</h2>
            <p className="mb-4 leading-relaxed">
              Cookies are small text files stored on your browser or device when you visit a website. They help us remember your login session, active profiles, streaming preferences, and search queries.
            </p>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">2. Types of Cookies We Use</h2>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li><strong>Essential Cookies:</strong> Critical for core application functionalities, such as maintaining user sessions and profile states.</li>
              <li><strong>Preference Cookies:</strong> Used to store settings like language, video playback volume, and theme modes.</li>
              <li><strong>Analytics Cookies:</strong> Help us aggregate user patterns and monitor website performance to optimize content loading speeds.</li>
            </ul>
            <h2 className="text-xl font-bold text-white mb-4 mt-6">3. Managing Cookies</h2>
            <p className="mb-4 leading-relaxed">
              Most web browsers allow you to control cookies through their settings menus. If you choose to reject essential cookies, some parts of the V19Plus streaming service and player may not function properly.
            </p>
          </>
        );
      default:
        return (
          <p className="mb-4 leading-relaxed">
            Please check back shortly, or contact our legal team at <a href="mailto:legal@v19plus.app" className="text-n-red hover:underline">legal@v19plus.app</a> if you have immediate inquiries regarding our policies, data protection, or service terms.
          </p>
        );
    }
  };

  return (
    <div className="min-h-screen bg-n-black text-n-text pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-[#111] border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-8 border-b border-white/10 pb-6">{title}</h1>
        <div className="prose prose-invert max-w-none text-n-text/90">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
