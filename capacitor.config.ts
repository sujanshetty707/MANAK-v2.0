import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.gov.manak.compliance',
  appName: 'MANAK',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      releaseType: 'APK'
    }
  }
};

export default config;
