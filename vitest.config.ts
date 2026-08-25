import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __ATLAS_DEVELOPMENT_SANDBOX__: 'true',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/react/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
