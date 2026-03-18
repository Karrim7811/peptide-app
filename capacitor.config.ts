// Capacitor native app config
// Setup: npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
// Then:  npx cap add ios && npx cap add android && npx cap sync

export default {
  appId: 'ai.peptidecortex.app',
  appName: 'Peptide Cortex',
  // Points the native WebView at the live domain — no local build needed
  server: {
    url: 'https://peptidecortex.ai',
    cleartext: false,
    allowNavigation: ['peptidecortex.ai', '*.peptidecortex.ai'],
  },
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#E8E5E0',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'Light',
      backgroundColor: '#E8E5E0',
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#FAFAF8',
    preferredContentMode: 'mobile',
  },
  android: {
    backgroundColor: '#FAFAF8',
    allowMixedContent: false,
  },
}
