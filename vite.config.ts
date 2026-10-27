/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { parseRuntimeConfig } from './src/config/parseRuntimeConfig'
import { environmentPort } from './scripts/lib/environment.mjs'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  parseRuntimeConfig(env)
  const port = environmentPort(env, 'DEV_PORT', 3100)
  const host = env.DEV_HOST || '127.0.0.1'
  return {
    server: { host, port, strictPort: true },
    preview: { host, port, strictPort: true },
    plugins: [react()],
    css: { postcss: { plugins: [] } },
    build: { outDir: 'dist', sourcemap: false },
    test: {
      env: {
        VITE_CONTACT_PAGE_SIZE: '50',
        VITE_CONTACT_RECORD_PAGE_SIZE: '20',
        VITE_BRIDGE_DATA_TIMEOUT_MS: '15000',
        VITE_BRIDGE_PERMISSION_TIMEOUT_MS: '180000',
      },
      include: ['tests/**/*.test.{ts,tsx}'],
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      restoreMocks: true,
      clearMocks: true,
    },
  }
})
