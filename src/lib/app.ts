import { createContext, useContext } from 'react'
import type { Db } from './db'
import type { Session } from './session'
import { useMyDb } from './store'

export const MeContext = createContext<Session | null>(null)

/** Sesión y datos propios. Solo se usa dentro del área del cliente o del despacho. */
export function useApp(): { me: Session; db: Db } {
  const me = useContext(MeContext)
  if (!me) throw new Error('useApp se usa dentro de un área con sesión')
  return { me, db: useMyDb(me) }
}

export const newId = () => crypto.randomUUID()
