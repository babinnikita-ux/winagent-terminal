import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    // xterm.js is a deliberately isolated terminal-engine chunk (about 604 kB
    // minified); it cannot be meaningfully split without delaying terminal
    // startup. Keep the warning threshold above its measured size.
    chunkSizeWarningLimit: 650,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@xterm/')) return 'xterm';
          if (id.includes('node_modules/react')) return 'react';
          if (id.includes('node_modules/marked') || id.includes('node_modules/dompurify')) return 'content';
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    port: 5199,
    strictPort: false,
    fs: {
      allow: [
        // Allow serving files from the entire project root (needed for src/shared/)
        path.resolve(__dirname),
      ],
    },
  },
});
