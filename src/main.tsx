import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Appens startpunkt: hittar <div id="root"> i index.html och renderar hela appen där.
// StrictMode är ett utvecklingsläge som hjälper till att hitta vanliga buggar.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
