import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      mongoose: path.resolve(__dirname, '../backend/node_modules/mongoose'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 300000,
    include: ['**/*.test.ts'],
    fileParallelism: false, // Run test files sequentially to share in-memory database cleanly
  },
});
