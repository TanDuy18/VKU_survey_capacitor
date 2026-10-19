import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest', // dùng sw.js tự viết (Cache-First + Background Sync)
      srcDir: 'src',
      filename: 'sw.js',
      manifest: false, // dùng public/manifest.json
      injectRegister: false, // đăng ký trong src/main.jsx
      injectManifest: { globPatterns: ['**/*.{js,css,html,woff2,png,svg,json}'] },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173 },
});
