import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Repo name drives the GitHub Pages base path: the site serves from
// https://rdebrigard4.github.io/<REPO>/ , so assets must be requested
// under /<REPO>/ in production. In dev we serve from root.
const REPO = 'worldcup-2026'

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? `/${REPO}/` : '/'
  return {
    base,
    plugins: [react()],
  }
})
