import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '.next/',
        'tailwind.config.ts',
        'next.config.ts',
        '*.config.ts',
        '*.config.js',
        'app/**/*.stories.tsx',
        'app/**/layout.tsx',
        'app/**/page.tsx',
      ]
    },
    exclude: [
      'node_modules',
      '.next',
      'supabase/tests/**',
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '@/test': path.resolve(__dirname, './test'),
    }
  }
})