import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const savedTheme = localStorage.getItem('auto-store-manager-theme')
document.documentElement.setAttribute(
  'data-theme',
  savedTheme === 'light' ? 'light' : 'dark',
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
