import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  const apiKey = env.API_KEY || env.GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
  const isProd = mode === 'production';

  return {
    // Relative base path is crucial for Capacitor apps to load assets from local file system on iOS & Android
    base: './',
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    esbuild: {
      // Strip console and debugger statements in production builds to prevent code inspection
      drop: isProd ? ['console', 'debugger'] : [],
      legalComments: 'none',
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
    },
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false, // Disables source maps entirely to prevent reverse engineering
      minify: 'esbuild',
      target: 'es2020',
      cssMinify: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'th_core';
              }
              if (id.includes('lucide-react')) {
                return 'th_icons';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'th_charts';
              }
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'th_reports';
              }
              if (id.includes('@capacitor')) {
                return 'th_native';
              }
              return 'th_vendor';
            }
          },
          // Obfuscate generated asset and chunk names
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash].[ext]'
        }
      }
    }
  };
});
