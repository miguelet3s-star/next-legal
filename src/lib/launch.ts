// Datos del lanzamiento. PROVISIONALES: confirmar fecha y lista de espera antes de publicar.

/** Fecha de lanzamiento (3 semanas desde el 12 nov 2026, 9:00 a.m. hora de Honduras, UTC-6). */
export const LAUNCH_DATE = new Date('2026-12-03T09:00:00-06:00')

/** Personas que ya estaban en la lista de espera antes de este registro. */
export const WAITLIST_BASE = 327

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

export function timeLeft(target: Date, now: Date = new Date()): TimeLeft {
  const ms = Math.max(0, target.getTime() - now.getTime())
  const s = Math.floor(ms / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: ms === 0,
  }
}

export const pad2 = (n: number) => String(n).padStart(2, '0')

export function formatLaunchDate(d: Date = LAUNCH_DATE): string {
  return d.toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Tegucigalpa' })
}

/**
 * ¿Ya abrió Next Legal? Desde la fecha de lanzamiento el botón "Crear cuenta" pasa a "Iniciar sesión".
 * Para ver la versión lanzada antes de tiempo: agregue ?lanzado=1 a la dirección.
 */
export function isLaunched(now: Date = new Date(), search: string = typeof window !== 'undefined' ? window.location.search : ''): boolean {
  return now.getTime() >= LAUNCH_DATE.getTime() || new URLSearchParams(search).get('lanzado') === '1'
}
