import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Os testes compartilham o mesmo banco e o limpam a cada caso.
    fileParallelism: false,
    hookTimeout: 30_000,
  },
});
