import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/EasyLean/',
  // Two pages: the course (index.html) and its handwritten version.
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        handwritten: 'handwritten.html',
      },
    },
  },
  test: {
    // e2e/ holds the Playwright specs, which Vitest must not pick up.
    include: ['src/**/*.test.{js,jsx}'],
  },
})
