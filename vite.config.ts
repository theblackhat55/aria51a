import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    build({
      entry: 'src/index.ts', // Points to HTMX version
      outputDir: 'dist',
      minify: true
    }),
    devServer({
      adapter,
      entry: 'src/index.ts' // Points to HTMX version
    })
  ],
  
  // Path resolution for clean imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/routes': resolve(__dirname, 'src/routes'),
      '@/middleware': resolve(__dirname, 'src/middleware')
    }
  },
  
  // Optimized build configuration for Cloudflare Pages
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    minify: 'esbuild',
    sourcemap: true,
    
    rollupOptions: {
      output: {
        // Organize static assets
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'static/css/[name].[hash].[ext]'
          }
          return 'static/[name].[hash].[ext]'
        },
        
        // Optimize chunk naming
        chunkFileNames: 'static/js/[name].[hash].js',
        entryFileNames: '_worker.js', // Cloudflare Pages entry point
        
        // Manual chunks for better caching
        manualChunks: undefined // Let Vite optimize automatically
      }
    },
    
    // Cloudflare Workers size limits
    chunkSizeWarningLimit: 1000, // 1MB warning (10MB limit)
    assetsInlineLimit: 4096 // 4KB inline threshold
  },
  
  // Development server
  server: {
    port: 5173,
    host: '0.0.0.0',
    cors: true
  },
  
  // Preview server
  preview: {
    port: 4173,
    host: '0.0.0.0'
  },
  
  // Environment variables
  envPrefix: ['VITE_', 'ARIA5_'],
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'hono',
      'hono/cors',
      'hono/logger', 
      'hono/jwt',
      'hono/cloudflare-workers'
    ]
  }
})
