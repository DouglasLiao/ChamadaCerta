/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  css: { postcss: { plugins: [] } },
  build: { outDir: 'dist', sourcemap: false },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    restoreMocks: true,
    clearMocks: true,
  },
});
