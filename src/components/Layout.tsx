import { Bell, CalendarBlank, CalendarCheck, ChatCircleText, CreditCard, FileText, FolderOpen, House, MagnifyingGlass, Money, SealCheck, SignOut, SunHorizon, UserCircle, UserFocus, UsersThree } from '@phosphor-icons/react'
import type { Icon as PhIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getLawyer } from '../data/mock'
import { threadsOf } from '../lib/db'
import { formatLong, relativeDay, today } from '../lib/dates'
import type { Role, Session } from '../lib/session'
import { resolveAccess, signOut, useSession } from '../lib/session'
import { useMyDb } from '../lib/store'
import '../app.css'
import { BrandLogo } from './BrandLogo'
import { Avatar } from './ui'
import { Guilloche, Toaster, useReveal } from './visual'
import { MeContext } from '../lib/app'

interface NavItem { to: string; label: string; icon: PhIcon; end?: boolean }

const NAV: Record<Role, { side: NavItem[]; bottom: NavItem[] }> = {
  cliente: {
    side: [
      { to: '/inicio', label: 'Inicio', icon: House },
      { to: '/buscar', label: 'Buscar abogado', icon: UserFocus },
      { to: '/casos', label: 'Mis casos', icon: FolderOpen },
      { to: '/consultas', label: 'Consultas', icon: CalendarBlank },
      { to: '/documentos', label: 'Documentos', icon: FileText },
      { to: '/pagos', label: 'Pagos', icon: CreditCard },
      { to: '/mensajes', label: 'Mensajes', icon: ChatCircleText },
      { to: '/perfil', label: 'Mi perfil', icon: UserCircle },
    ],
    bottom: [
      { to: '/inicio', label: 'Inicio', icon: House },
      { to: '/buscar', label: 'Buscar', icon: MagnifyingGlass },
      { to: '/casos', label: 'Casos', icon: FolderOpen },
      { to: '/mensajes', label: 'Mensajes', icon: ChatCircleText },
      { to: '/perfil', label: 'Perfil', icon: UserCircle },
    ],
  },
  abogado: {
    side: [
      { to: '/despacho', label: 'Hoy', icon: SunHorizon, end: true },
      { to: '/despacho/agenda', label: 'Agenda', icon: CalendarCheck },
      { to: '/despacho/casos', label: 'Expedientes', icon: FolderOpen },
      { to: '/despacho/clientes', label: 'Clientes', icon: UsersThree },
      { to: '/despacho/mensajes', label: 'Mensajes', icon: ChatCircleText },
      { to: '/despacho/ingresos', label: 'Ingresos', icon: Money },
      { to: '/despacho/perfil', label: 'Mi perfil', icon: UserCircle },
    ],
    bottom: [
      { to: '/despacho', label: 'Hoy', icon: SunHorizon, end: true },
      { to: '/despacho/agenda', label: 'Agenda', icon: CalendarCheck },
      { to: '/despacho/casos', label: 'Expedientes', icon: FolderOpen },
      { to: '/despacho/mensajes', label: 'Mensajes', icon: ChatCircleText },
      { to: '/despacho/perfil', label: 'Perfil', icon: UserCircle },
    ],
  },
}

interface Notice { id: string; to: string; title: string; text: string }

/** Avisos de la campana, calculados con los datos propios. */
function useNotices(me: Session): Notice[] {
  const db = useMyDb(me)
  const base = me.role === 'cliente' ? '' : '/despacho'
  const ref = today()
  const out: Notice[] = []
  const unread = threadsOf(db.messages, me.role).reduce((n, t) => n + t.unread, 0)
  if (unread) out.push({ id: 'msg', to: `${base}/mensajes`, title: unread === 1 ? 'Tiene 1 mensaje nuevo' : `Tiene ${unread} mensajes nuevos`, text: 'Toque para leerlo.' })
  if (me.role === 'abogado') {
    const pending = db.consultations.filter((c) => c.status === 'por-confirmar').length
    if (pending) out.push({ id: 'req', to: '/despacho/agenda', title: pending === 1 ? '1 persona pidió una consulta' : `${pending} personas pidieron una consulta`, text: 'Confirme si puede atenderlas.' })
  } else {
    const next = db.consultations.filter((c) => c.status === 'confirmada' && c.date >= ref).sort((a, b) => a.date.localeCompare(b.date))[0]
    if (next) out.push({ id: 'con', to: '/consultas', title: 'Su próxima consulta está confirmada', text: `${relativeDay(next.date, ref)} con ${getLawyer(next.lawyerId)?.name ?? 'su abogado'}.` })
    const latest = db.cases.filter((c) => c.updates[0]).sort((a, b) => b.updates[0].at.localeCompare(a.updates[0].at))[0]
    if (latest) out.push({ id: 'case', to: `/casos/${latest.id}`, title: `Avance en su caso: ${latest.updates[0].title}`, text: latest.title })
  }
  return out
}

function Notices({ me, light = false }: { me: Session; light?: boolean }) {
  const notices = useNotices(me)
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  return (
    <div className="notices" ref={box}>
      <button className={`icon-btn ${light ? 'light' : ''}`} aria-label={`Avisos: ${notices.length}`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Bell size={22} />{notices.length > 0 && <span className="dot" />}
      </button>
      {open && (
        <div className="notices-pop" role="menu">
          <b className="notices-title">Avisos</b>
          {notices.length === 0 ? <p className="muted small">Está al día. Aquí verá los avisos de sus casos y consultas.</p> : notices.map((n) => (
            <Link key={n.id} to={n.to} className="notice" role="menuitem" onClick={() => setOpen(false)}>
              <b>{n.title}</b><small className="muted">{n.text}</small>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Shell({ role }: { role: Role }) {
  const me = useSession()
  const { pathname } = useLocation()
  const access = resolveAccess(pathname, me)
  if (!me || !access.allow) return <Navigate to={access.allow ? '/entrar' : access.redirect} replace />
  return <MeContext.Provider value={me}><ShellBody me={me} role={role} /></MeContext.Provider>
}

function ShellBody({ me, role }: { me: Session; role: Role }) {
  const navigate = useNavigate()
  const db = useMyDb(me)
  const { pathname } = useLocation()
  const [q, setQ] = useState('')
  const lawyer = role === 'abogado' ? getLawyer(me.userId) : undefined
  const name = lawyer?.name ?? db.clients.find((c) => c.id === me.userId)?.name ?? ''
  const { side, bottom } = NAV[role]
  const unread = threadsOf(db.messages, role).reduce((n, t) => n + t.unread, 0)

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useReveal(pathname)

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/buscar?q=${encodeURIComponent(q.trim())}`)
  }
  const leave = () => { signOut(); navigate('/entrar') }

  return (
    <div className={`shell ${role === 'abogado' ? 'despacho' : ''}`}>
      <aside className="sidebar">
        <Guilloche />
        <Link to={side[0].to} className="side-logo" aria-label="Next Legal">
          <BrandLogo tone={role === 'abogado' ? 'dark' : 'light'} animated={false} />
          {role === 'abogado' && <span>Despacho</span>}
        </Link>

        {lawyer && (
          <div className="credential">
            <Guilloche />
            <Avatar name={lawyer.name} photo={lawyer.photo} size={52} />
            <div>
              <b>{lawyer.name}</b>
              <small>Colegiación N.º {lawyer.bar}</small>
              <span className="credential-seal"><SealCheck weight="fill" size={15} /> Verificado</span>
            </div>
          </div>
        )}

        <nav aria-label="Secciones">
          {side.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              {({ isActive }) => <><Icon size={20} weight={isActive ? 'fill' : 'duotone'} /> {label}{label === 'Mensajes' && unread > 0 && <span className="count">{unread}</span>}</>}
            </NavLink>
          ))}
        </nav>

        <div className="side-foot">
          {!lawyer && <Link to="/perfil" className="side-user"><Avatar name={name} size={40} /><span><b>{name}</b><small>Ver mi perfil</small></span></Link>}
          <button className="side-link side-out" onClick={leave}><SignOut size={20} /> Cerrar sesión</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          {/* En el inicio del cliente la búsqueda ya está en el saludo: no se repite arriba. */}
          {role === 'abogado' ? (
            <p className="topbar-date">{formatLong(today())}</p>
          ) : pathname === '/inicio' ? null : (
            <form className="search" onSubmit={onSearch} role="search">
              <MagnifyingGlass size={18} className="muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Escriba su problema: despido, pensión, terreno…" aria-label="Buscar abogado" />
              <button className="search-btn" aria-label="Buscar"><MagnifyingGlass size={18} weight="bold" /></button>
            </form>
          )}
          <span className="topbar-end">
            <Notices me={me} />
            {role === 'cliente' && <Link to="/perfil" className="user"><Avatar name={name} size={38} /> <span>{name}</span></Link>}
          </span>
        </header>

        <header className="mobile-bar">
          <BrandLogo tone={role === 'abogado' ? 'dark' : 'light'} animated={false} />
          {role === 'abogado' && <span className="mobile-tag">Despacho</span>}
          <Notices me={me} light={role === 'cliente'} />
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <Toaster />
      <nav className="bottom-nav" aria-label="Secciones">
        {bottom.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="bottom-link">
            {({ isActive }) => <><span className="bottom-ic"><Icon size={24} weight={isActive ? 'fill' : 'duotone'} />{label === 'Mensajes' && unread > 0 && <span className="dot" />}</span><span>{label}</span></>}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** Área del cliente. */
export function ClientLayout() { return <Shell role="cliente" /> }

/** Área del abogado (despacho). */
export function LawyerLayout() { return <Shell role="abogado" /> }
