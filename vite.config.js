import { defineConfig } from 'vite';

export default defineConfig({
  // This ensures paths work correctly when opened as a local file in Capacitor
  base: './', 
  build: {
    outDir: 'dist',
    // If you want one single JS file, use 'lib' mode:
    lib: {
      entry: './player.js',
      name: 'AudioTour',
      fileName: 'audio-tour'
    }
  }
});