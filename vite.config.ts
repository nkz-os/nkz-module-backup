import { defineConfig } from 'vite';
import { nkzModulePreset } from '@nekazari/module-builder';
import path from 'path';

export default defineConfig(
  nkzModulePreset({
    viteConfig: {
      resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
      },
      server: {
        port: 5004,
        proxy: {
          '/api': {
            target: process.env.VITE_PROXY_TARGET || 'https://nkz.robotika.cloud',
            changeOrigin: true,
            secure: true,
          },
        },
      },
    },
  }),
);
