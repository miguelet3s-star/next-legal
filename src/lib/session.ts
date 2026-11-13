// Sesión del prototipo: se guarda solo en este dispositivo. La autenticación real
// (Supabase Auth) reemplazará este archivo; las reglas de acceso se aplicarán además en el servidor.
import { useSyncExternalStore } from 'react'

export type Role = 'cliente' | 'abogado'

export interface Session {
  role: Role
  userId: string
}

/** Cuentas con las que entra el prototipo según el tipo de cuenta elegido. */
export const DEMO_USER: Record<Role, string> = { cliente: 'juan-perez', abogado: 'andrea-castillo' }

export const HOME: Record<Role, string> = { cliente: '/inicio', abogado: '/despacho' }

const CLIENT_PREFIXES = ['/inicio', '/buscar', '/abogado', '/agendar', '/casos', '/consultas', '/documentos', '/pagos', '/mensajes', '/perfil', '/configuracion']

function under(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + '/')
}

/** A quién pertenece una ruta: al cliente, al abogado o a nadie (pública). */
export function areaOf(pathname: string): Role | 'publica' {
  if (under(pathname, '/despacho')) return 'abogado'
  if (CLIENT_PREFIXES.some((p) => under(pathname, p))) return 'cliente'
  return 'publica'
}

/**
 * Decide si una ruta se puede ver. Las páginas del cliente y las del abogado no se cruzan:
 * quien entra a la otra área vuelve a su propio inicio; sin sesión, va a iniciar sesión.
 */
export function resolveAccess(pathname: string, session: Session | null): { allow: true } | { allow: false; redirect: string } {
  const area = areaOf(pathname)
  if (area === 'publica') return { allow: true }
  if (!session) return { allow: false, redirect: '/entrar' }
  if (session.role !== area) return { allow: false, redirect: HOME[session.role] }
  return { allow: true }
}

const KEY = 'nextlegal.session.v1'
const listeners = new Set<() => void>()
let cached: Session | null | undefined

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Partial<Session>
    if ((s.role === 'cliente' || s.role === 'abogado') && typeof s.userId === 'string') return { role: s.role, userId: s.userId }
  } catch { /* sin almacenamiento o dato dañado: sin sesión */ }
  return null
}

export function getSession(): Session | null {
  if (cached === undefined) cached = read()
  return cached
}

function set(next: Session | null) {
  cached = next
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next))
    else localStorage.removeItem(KEY)
  } catch { /* la sesión vive solo en memoria */ }
  listeners.forEach((l) => l())
}

export function signIn(role: Role): Session {
  const s: Session = { role, userId: DEMO_USER[role] }
  set(s)
  return s
}

export function signOut() {
  set(null)
}

export function useSession(): Session | null {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, getSession, () => null)
}
