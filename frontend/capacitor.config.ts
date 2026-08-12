import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.edova.teach',
  appName: 'Edova Teach',
  webDir: 'dist',
  android: {
    // WebView allows mixed content only in dev; production API must be HTTPS.
    allowMixedContent: false,
  },
}

export default config
