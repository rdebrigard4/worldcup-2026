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
