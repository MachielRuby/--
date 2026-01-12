import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        modelViewer: resolve(__dirname, 'model-viewer.html'),
        arJs: resolve(__dirname, 'ar-js.html'),
        arThree: resolve(__dirname, 'ar-three.html'),
      },
    },
  },
});