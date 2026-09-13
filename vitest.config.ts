import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@halo-rc/db': path.resolve(__dirname, './packages/db/src'),
      '@halo-rc/ui': path.resolve(__dirname, './packages/ui/src'),
      '@halo-rc/types': path.resolve(__dirname, './packages/types/src'),
    },
  },
})
