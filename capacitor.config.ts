// Capacitor native app config
// Setup: npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
// Then:  npx cap add ios && npx cap add android && npx cap sync

export default {
  appId: 'ai.peptidecortex.app',
  appName: 'Peptide Cortex',
  server: {
    url: 'https://peptide-app-nine.vercel.app/login',
    allowNavigation: ['peptide-app-nine.vercel.app', '*.vercel.app', 'peptidecortex.com', '*.peptidecortex.com'],
  },
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      autoHide: true,
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
