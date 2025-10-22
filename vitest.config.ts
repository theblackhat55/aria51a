import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/core/**/*.ts'],
      exclude: [
        'src/core/index.ts',
        'src/core/**/*.d.ts',
        'src/core/**/*.test.ts',
        'src/core/**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/.wrangler/**'
      ],
      all: true,
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90
      }
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.wrangler/**'],
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
