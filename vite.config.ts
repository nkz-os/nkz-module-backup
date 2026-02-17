import { defineConfig } from 'vite';
import { nkzModulePreset } from '@nekazari/module-builder';
import path from 'path';

const MODULE_ID = 'backup';

export default defineConfig(nkzModulePreset({
    moduleId: MODULE_ID,
    entry: 'src/moduleEntry.tsx',

    viteConfig: {
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: 5004,
            proxy: {
                '/api': {
                    target: 'https://nkz.robotika.cloud',
                    changeOrigin: true,
                    secure: true,
                },
            },
        }
    }
}));
