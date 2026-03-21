import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  return {
    // Only copy the public folder when we are NOT building the library
    publicDir: command === 'build' ? false : 'public',

    build: {
      lib: {
        entry: './src/player.js',
        name: 'AudioTourPlayer',
        fileName: 'audio-tour-player',
        formats: ['es']
      },
      rollupOptions: {
        output: {
          codeSplitting: false,
        }
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      sourcemap: true
    }
  };
});