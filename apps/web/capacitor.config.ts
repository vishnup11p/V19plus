import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Live-reload the production Vercel app inside the native WebView.
 * Set CAPACITOR_SERVER_URL to your deployed web URL before building the APK.
 */
const config: CapacitorConfig = {
  appId: 'com.v19plus.app',
  appName: 'V19+',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://YOUR_WEB_APP.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
