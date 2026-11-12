import { Barricade } from '@phosphor-icons/react'
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import { EmptyState } from './components/ui'
import Booking from './pages/Booking'
import { CaseDetail, CaseList } from './pages/Cases'
import Home from './pages/Home'
import LawyerProfile from './pages/LawyerProfile'
import CorreoPreview from './pages/CorreoPreview'
import KioskLeads from './pages/KioskLeads'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Search from './pages/Search'

function Soon({ title }: { title: string }) {
  return <EmptyState icon={Barricade} title={title} text="Pantalla en construcción para la siguiente iteración." />
}

const KIOSK_KEY = 'nextlegal.kiosk'
const IDLE_MS = 90_000

/** Modo kiosko (?kiosko=1): tras 90 s sin tocar la pantalla vuelve a la portada. */
function KioskIdle() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const p = new URLSearchParams(search).get('kiosko')
    try {
      if (p === '1') localStorage.setItem(KIOSK_KEY, '1')
      if (p === '0') localStorage.removeItem(KIOSK_KEY)
    } catch { /* sin almacenamiento: modo kiosko desactivado */ }
  }, [search])

  useEffect(() => {
    let on = false
    try { on = localStorage.getItem(KIOSK_KEY) === '1' } catch { /* noop */ }
    const embedded = window.self !== window.top
    if (!on || embedded) return
    let t = 0
    const reset = () => {
      clearTimeout(t)
      t = window.setTimeout(() => {
        if (pathname !== '/') navigate('/')
        else window.scrollTo({ top: 0, behavior: 'smooth' })
      }, IDLE_MS)
    }
    const evs = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => { clearTimeout(t); evs.forEach((e) => window.removeEventListener(e, reset)) }
  }, [pathname, navigate])
  return null
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <KioskIdle />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/kiosko/registros" element={<KioskLeads />} />
        <Route path="/correo" element={<CorreoPreview />} />
        <Route element={<Layout />}>
          <Route path="/inicio" element={<Home />} />
          <Route path="/buscar" element={<Search />} />
          <Route path="/abogado/:id" element={<LawyerProfile />} />
          <Route path="/agendar/:id" element={<Booking />} />
          <Route path="/casos" element={<CaseList />} />
          <Route path="/casos/:id" element={<CaseDetail />} />
          <Route path="/consultas" element={<Soon title="Consultas" />} />
          <Route path="/documentos" element={<Soon title="Documentos" />} />
          <Route path="/pagos" element={<Soon title="Pagos" />} />
          <Route path="/mensajes" element={<Soon title="Mensajes" />} />
          <Route path="/configuracion" element={<Soon title="Configuración" />} />
          <Route path="/perfil" element={<Soon title="Perfil" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
