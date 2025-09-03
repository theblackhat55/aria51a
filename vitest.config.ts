import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment configuration
    environment: 'happy-dom', // Lightweight DOM for testing
    
    // Global test configuration
    globals: true,
    
    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,ts}',
      'src/**/*.{test,spec}.{js,ts}'
    ],
    
    // Test exclusions
    exclude: [
      'node_modules',
      'dist',
      '.wrangler',
      'tests/e2e/**/*' // E2E tests use Playwright
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,ts}'],
      exclude: [
        'src/**/*.{test,spec}.{js,ts}',
        'src/types/**/*',
        'dist/**/*'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true
  },
  
  // Path resolution matching main config
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/routes': resolve(__dirname, 'src/routes'),
      '@/middleware': resolve(__dirname, 'src/middleware')
    }
  },
  
  // Define globals for Cloudflare Workers
  define: {
    // Cloudflare Workers globals
    'globalThis.navigator': 'undefined',
    'globalThis.window': 'undefined',
    'globalThis.document': 'undefined'
  }
})