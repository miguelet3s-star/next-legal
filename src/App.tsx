import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Chat from './components/Chat'
import { ClientLayout, LawyerLayout } from './components/Layout'
import { signOut } from './lib/session'
import Booking from './pages/Booking'
import { CaseDetail, CaseList } from './pages/Cases'
import Consultas from './pages/Consultas'
import CorreoPreview from './pages/CorreoPreview'
import Documentos from './pages/Documentos'
import Home from './pages/Home'
import KioskLeads from './pages/KioskLeads'
import Landing from './pages/Landing'
import LawyerProfile from './pages/LawyerProfile'
import Login from './pages/Login'
import Pagos from './pages/Pagos'
import Perfil from './pages/Perfil'
import Search from './pages/Search'
import Agenda from './pages/despacho/Agenda'
import { DeskCaseDetail, DeskCaseList } from './pages/despacho/Casos'
import Clientes from './pages/despacho/Clientes'
import Hoy from './pages/despacho/Hoy'
import Ingresos from './pages/despacho/Ingresos'
import DeskPerfil from './pages/despacho/Perfil'

const KIOSK_KEY = 'nextlegal.kiosk'
const IDLE_MS = 90_000

/** Modo kiosko (?kiosko=1): tras 90 s sin tocar la pantalla cierra la sesión y vuelve a la portada. */
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
        signOut()
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

        {/* Área del cliente */}
        <Route element={<ClientLayout />}>
          <Route path="/inicio" element={<Home />} />
          <Route path="/buscar" element={<Search />} />
          <Route path="/abogado/:id" element={<LawyerProfile />} />
          <Route path="/agendar/:id" element={<Booking />} />
          <Route path="/casos" element={<CaseList />} />
          <Route path="/casos/:id" element={<CaseDetail />} />
          <Route path="/consultas" element={<Consultas />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/pagos" element={<Pagos />} />
          <Route path="/mensajes" element={<Chat />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracion" element={<Navigate to="/perfil" replace />} />
        </Route>

        {/* Área del abogado: el despacho */}
        <Route path="/despacho" element={<LawyerLayout />}>
          <Route index element={<Hoy />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="casos" element={<DeskCaseList />} />
          <Route path="casos/:id" element={<DeskCaseDetail />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="mensajes" element={<Chat />} />
          <Route path="ingresos" element={<Ingresos />} />
          <Route path="perfil" element={<DeskPerfil />} />
          <Route path="*" element={<Navigate to="/despacho" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
