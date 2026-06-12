import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Appens start: renderar hela appen i <div id="root"> från index.html.
// StrictMode är ett utvecklingsläge som hjälper till att hitta vanliga buggar.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
