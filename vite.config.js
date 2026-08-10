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
          drop_console: false,
          drop_debugger: true,
          // Keep important console output (log/warn/error) and strip debug/info/tracing helpers.
          pure_funcs: [
            'console.debug',
            'console.info',
            'console.trace',
            'console.table',
            'console.group',
            'console.groupCollapsed',
            'console.groupEnd',
            'console.assert'
          ]
        }
      },
      sourcemap: true
    }
  };
});