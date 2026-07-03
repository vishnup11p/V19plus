import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Live-reload the production Netlify app inside the native WebView.
 * Set CAPACITOR_SERVER_URL to your deployed web URL before building the APK.
 */
const config: CapacitorConfig = {
  appId: 'com.v19plus.app',
  appName: 'V19Plus',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://v19plus-web.netlify.app',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
