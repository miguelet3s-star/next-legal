// Guarda los datos de la app en este dispositivo y avisa a las pantallas cuando cambian.
import { useMemo, useSyncExternalStore } from 'react'
import type { Db } from './db'
import { scopeDb, seed } from './db'
import { today } from './dates'
import type { Session } from './session'

const KEY = 'nextlegal.app.v2'
const listeners = new Set<() => void>()
let state: Db | undefined

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch { /* sin almacenamiento o dato dañado: se parte de los datos iniciales */ }
  return seed(today())
}

export function getDb(): Db {
  if (!state) state = load()
  return state
}

/** Aplica un cambio (función pura de db.ts) y lo guarda. */
export function update(fn: (db: Db) => Db) {
  const next = fn(getDb())
  if (next === state) return
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* se conserva en memoria */ }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Datos de quien tiene la sesión. Las pantallas nunca reciben filas de otra persona. */
export function useMyDb(me: Session): Db {
  const db = useSyncExternalStore(subscribe, getDb, getDb)
  return useMemo(() => scopeDb(db, me), [db, me])
}

/** Archivos subidos en esta sesión, para poder abrirlos. No se guardan al cerrar la app. */
export const docUrls = new Map<string, string>()
