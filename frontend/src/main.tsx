import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import App from './pages/App'
import './styles/globals.css'

async function loadConfig() {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' })
    ;(window as any).__APP_CONFIG__ = await res.json()
  } catch {
    ;(window as any).__APP_CONFIG__ = {}
  }
}

async function bootstrap() {
  await loadConfig()
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  )
}

bootstrap()
