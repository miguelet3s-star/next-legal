import { Bell, CalendarBlank, ChatCircleText, CreditCard, FileText, FolderOpen, GearSix, Headset, House, MagnifyingGlass, UserCircle, UserFocus } from '@phosphor-icons/react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { currentUser } from '../data/mock'
import { Avatar, Logo } from './ui'

const sideNav = [
  { to: '/inicio', label: 'Inicio', icon: House },
  { to: '/buscar', label: 'Buscar abogado', icon: UserFocus },
  { to: '/casos', label: 'Mis casos', icon: FolderOpen },
  { to: '/consultas', label: 'Consultas', icon: CalendarBlank },
  { to: '/documentos', label: 'Documentos', icon: FileText },
  { to: '/pagos', label: 'Pagos', icon: CreditCard },
  { to: '/mensajes', label: 'Mensajes', icon: ChatCircleText },
  { to: '/configuracion', label: 'Configuración', icon: GearSix },
]

const bottomNav = [
  { to: '/inicio', label: 'Inicio', icon: House },
  { to: '/buscar', label: 'Buscar', icon: MagnifyingGlass },
  { to: '/casos', label: 'Mis casos', icon: FolderOpen },
  { to: '/mensajes', label: 'Mensajes', icon: ChatCircleText },
  { to: '/perfil', label: 'Perfil', icon: UserCircle },
]

export default function Layout() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/buscar?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <Logo size="sm" light />
        <nav>
          {sideNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="side-link">
              {({ isActive }) => <><Icon size={20} weight={isActive ? 'fill' : 'duotone'} /> {label}</>}
            </NavLink>
          ))}
        </nav>
        <div className="help-box">
          <div className="help-title"><Headset size={22} /> <div><b>¿Necesitas ayuda?</b><small>Estamos aquí para apoyarte.</small></div></div>
          <button className="btn btn-primary btn-block">Contactar soporte</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <form className="search" onSubmit={onSearch} role="search">
            <MagnifyingGlass size={18} className="muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Qué servicio legal necesitas?" aria-label="Buscar servicio legal" />
            <button className="search-btn" aria-label="Buscar"><MagnifyingGlass size={18} /></button>
          </form>
          <button className="icon-btn" aria-label="Notificaciones"><Bell size={22} /><span className="dot" /></button>
          <button className="icon-btn hide-mobile" aria-label="Mensajes" onClick={() => navigate('/mensajes')}><ChatCircleText size={22} /></button>
          <div className="user hide-mobile"><Avatar name={currentUser.name} size={38} /> <span>{currentUser.name}</span></div>
        </header>

        <header className="mobile-bar">
          <Logo size="sm" tagline={false} light />
          <button className="icon-btn light" aria-label="Notificaciones"><Bell size={22} /><span className="dot" /></button>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav">
        {bottomNav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="bottom-link">
            {({ isActive }) => <><Icon size={24} weight={isActive ? 'fill' : 'duotone'} /><span>{label}</span></>}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
