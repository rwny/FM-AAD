import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { inject } from '@vercel/analytics'
import './index.css'
import App from './App.tsx'
import { LandingPage } from './components/LandingPage.tsx'

inject()

// Google Analytics GA4
const gaId = import.meta.env.VITE_GA_ID
if (gaId) {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
  document.head.appendChild(script)
  const w = window as any
  w.dataLayer = w.dataLayer || []
  w.gtag = function () { w.dataLayer.push(arguments) }
  w.gtag('js', new Date())
  w.gtag('config', gaId)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)





