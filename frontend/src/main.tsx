import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import App from './pages/App'
import './styles/globals.css'

async function loadConfig() {
  try {
    console.log('Loading runtime config...', new Date().toISOString())
    const res = await fetch('/config.json', { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    })
    const config = await res.json()
    ;(window as any).__APP_CONFIG__ = config
    console.log('Runtime config loaded successfully:', config)
    console.log('Config will be used for API calls to:', config.apiBaseUrl)
  } catch (error) {
    console.error('Failed to load runtime config:', error)
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
