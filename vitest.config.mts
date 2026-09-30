import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname),
      'server-only': path.resolve(import.meta.dirname, 'tests/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts'],
      exclude: [
        'lib/**/index.ts',
        'lib/models/**',
        'lib/db/**',
        'lib/actions/**',
        'lib/data/**',
      ],
      reporter: ['text-summary', 'lcov'],
      // Guard against regressions; raise as coverage grows.
      thresholds: { statements: 60, branches: 65, functions: 65, lines: 60 },
    },
  },
});
