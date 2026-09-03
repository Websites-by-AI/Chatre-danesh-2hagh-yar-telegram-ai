import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Raise the limit + split vendor libs into cacheable chunks (perf).
      chunkSizeWarningLimit: 900,
      // فقط چانک‌های ضروری صفحه اول preload شوند — pdf/chart سنگین‌اند و بعداً lazy لود می‌شوند
      modulePreload: {
        resolveDependencies: (_url: string, deps: string[]) =>
          deps.filter((d) => !d.includes('pdf-vendor') && !d.includes('chart-vendor') && !d.includes('firebase-vendor')),
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'chart-vendor': ['recharts'],
            'icons-vendor': ['lucide-react'],
            'pdf-vendor': ['jspdf', 'jszip'],
          },
        },
      },
    },
    server: {
      // Allow proxied Cloudflare/Arena preview hosts. Express still binds only
      // to the configured public port and API authorization remains server-side.
      allowedHosts: true as const,
      // Completely disable HMR or fallback gracefully with no overlay and silent client connection
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        overlay: false,
        timeout: 10000,
      },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
