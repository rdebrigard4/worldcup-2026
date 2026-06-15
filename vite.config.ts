import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Repo name drives the GitHub Pages base path: the site serves from
// https://rdebrigard4.github.io/<REPO>/ , so assets must be requested
// under /<REPO>/ in production. In dev we serve from root.
const REPO = 'worldcup-2026'

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? `/${REPO}/` : '/'
  // A unique id per build. Baked into the JS bundle (__BUILD_ID__) AND stamped
  // into index.html as <meta name="build-id">, so the running app can compare
  // the two and self-update when a newer build is deployed (see main.tsx).
  const buildId = String(Date.now())
  return {
    base,
    define: { __BUILD_ID__: JSON.stringify(buildId) },
    plugins: [
      react(),
      {
        name: 'inject-build-id',
        transformIndexHtml() {
          return [{ tag: 'meta', attrs: { name: 'build-id', content: buildId }, injectTo: 'head' }]
        },
      },
    ],
  }
})
