import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['512x512.png'],
          devOptions: { enabled: mode === 'development' },
          manifest: {
            name: '奇幻积分乐园',
            short_name: 'Viviplay',
            description: '一个小巧的积分与宝库展示应用',
            start_url: '/',
            display: 'standalone',
            background_color: '#0f172a',
            theme_color: '#9333ea',
            icons: [
              { src: '/512x512.png', sizes: '512x512', type: 'image/png' },
              { src: '/512x512.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
