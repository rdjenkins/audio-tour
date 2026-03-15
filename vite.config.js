import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      // The entry point is your player logic
      entry: resolve(__dirname, 'src/player.js'),
      name: 'AudioTourPlayer',
      // The file name output
      fileName: 'audio-tour-player',
      // 'es' is for modern apps, 'umd' is for legacy/simple script tags
      formats: ['es', 'umd']
    },
    rollupOptions: {
      // If you decide to use an external library like "Howler" for audio,
      // you would list it here so it's not bundled twice.
      external: [],
      output: {
        globals: {
          // Global variables for UMD build
        }
      }
    }
  }
});