// Capacitor native app config
// Setup: npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
// Then:  npx cap add ios && npx cap add android && npx cap sync

export default {
  appId: 'app.peptidetracker',
  appName: 'PeptideTracker',
  // Points the native WebView at your deployed Vercel URL — no local build needed
  server: {
    url: 'https://peptide-app.vercel.app', // UPDATE to your Vercel URL
    cleartext: false,
  },
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0f172a',
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
  },
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: false,
  },
}
