import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import './index.css'
import { IconContext } from '@phosphor-icons/react'
import App from './App.tsx'

if (new URLSearchParams(location.search).has('embed')) document.documentElement.classList.add('embed')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IconContext.Provider value={{ weight: 'duotone' }}>
      <App />
    </IconContext.Provider>
  </StrictMode>,
)
