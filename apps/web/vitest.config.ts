import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      // `server-only` throws outside a React Server environment by design.
      'server-only': resolve(import.meta.dirname, 'test/stubs/server-only.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/features/**/*.{ts,tsx}'],
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 85 },
    },
  },
});
