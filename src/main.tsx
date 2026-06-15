import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker: keeps the home-screen (standalone) install from running a
// stale build after a deploy. Production only — a SW in dev fights Vite's HMR.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Whether a worker was already in charge when this page loaded. On the very
  // first install there's no controller, so the initial clients.claim() should
  // NOT trigger a reload (nothing stale to refresh). On later visits a
  // controllerchange means a NEW build just activated → reload to adopt it.
  const hadController = !!navigator.serviceWorker.controller
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    window.location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* registration failed (e.g. unsupported / blocked) — app still works */
    })
  })
}

// Self-update without reinstalling the home-screen shortcut. The service worker
// alone isn't enough: a standalone iOS app that's warm-resumed (switched back
// to, not cold-launched) keeps the old JS bundle in memory and never re-fetches
// the HTML, so it can sit on a stale build indefinitely. To fix that, whenever
// the app becomes visible/focused we ask the server for the latest index.html
// and compare its build id to the one baked into THIS bundle. If a newer build
// is live, reload once to adopt it. (No-store + a cache-bust query so we always
// hit the network; the service worker passes this probe straight through.)
if (import.meta.env.PROD) {
  let updating = false
  const checkForUpdate = async () => {
    if (updating || document.visibilityState !== 'visible' || !navigator.onLine) return
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}index.html?ts=${Date.now()}`, {
        cache: 'no-store',
      })
      if (!res.ok) return
      const live = (await res.text()).match(/name="build-id" content="([^"]+)"/)?.[1]
      if (live && live !== __BUILD_ID__) {
        updating = true
        window.location.reload()
      }
    } catch {
      /* offline or blocked — we'll check again on the next focus */
    }
  }
  document.addEventListener('visibilitychange', checkForUpdate)
  window.addEventListener('focus', checkForUpdate)
  checkForUpdate()
}
