// Fechas de la app como texto ISO local (AAAA-MM-DD) y horas como HH:MM en 24 h.
// Se arman con la hora local del dispositivo para que "hoy" nunca se corra de día.
export type IsoDate = string

export function toIso(d: Date): IsoDate {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function fromIso(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: IsoDate, n: number): IsoDate {
  const d = fromIso(iso)
  d.setDate(d.getDate() + n)
  return toIso(d)
}

/** Suma días hábiles (lunes a viernes); con n = 0 devuelve la misma fecha. */
export function addWorkdays(iso: IsoDate, n: number): IsoDate {
  let d = iso
  for (let left = Math.abs(n); left > 0; ) {
    d = addDays(d, Math.sign(n))
    const wd = fromIso(d).getDay()
    if (wd !== 0 && wd !== 6) left--
  }
  return d
}

export const today = (): IsoDate => toIso(new Date())

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export const weekday = (iso: IsoDate) => WEEKDAYS[fromIso(iso).getDay()]
export const monthName = (iso: IsoDate) => MONTHS[fromIso(iso).getMonth()]
export const monthShort = (iso: IsoDate) => monthName(iso).slice(0, 3)
export const dayNumber = (iso: IsoDate) => fromIso(iso).getDate()

/** "martes 17 de noviembre" */
export function formatLong(iso: IsoDate): string {
  return `${weekday(iso)} ${dayNumber(iso)} de ${monthName(iso)}`
}

/** "17 nov 2026" */
export function formatShort(iso: IsoDate): string {
  return `${dayNumber(iso)} ${monthShort(iso)} ${fromIso(iso).getFullYear()}`
}

/** "Hoy", "Mañana", "Ayer" o "martes 17 de noviembre". */
export function relativeDay(iso: IsoDate, ref: IsoDate = today()): string {
  if (iso === ref) return 'Hoy'
  if (iso === addDays(ref, 1)) return 'Mañana'
  if (iso === addDays(ref, -1)) return 'Ayer'
  return formatLong(iso)
}

/** "Hoy", "Mañana", "Ayer" o "17 nov 2026". */
export function relativeShort(iso: IsoDate, ref: IsoDate = today()): string {
  const rel = relativeDay(iso, ref)
  return rel === formatLong(iso) ? formatShort(iso) : rel
}

/** "14:30" → "2:30 p.m." */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a.m.' : 'p.m.'}`
}

/** Próximos `count` días (a partir de mañana) que caen en los días de atención (0 = domingo). */
export function nextOpenDays(ref: IsoDate, openWeekdays: number[], count: number): IsoDate[] {
  const out: IsoDate[] = []
  if (openWeekdays.length === 0) return out
  for (let i = 1; out.length < count && i <= 60; i++) {
    const d = addDays(ref, i)
    if (openWeekdays.includes(fromIso(d).getDay())) out.push(d)
  }
  return out
}

/** Horas en punto entre `from` (incluida) y `to` (excluida): "08:00", "09:00"… */
export function hourSlots(from: string, to: string): string[] {
  const a = Number(from.split(':')[0])
  const b = Number(to.split(':')[0])
  const out: string[] = []
  for (let h = a; h < b; h++) out.push(`${String(h).padStart(2, '0')}:00`)
  return out
}

/** "2026-11-12T14:05" → "2:05 p.m." si es hoy; si no, "12 nov". */
export function formatStamp(at: string, ref: IsoDate = today()): string {
  const [d, t] = at.split('T')
  return d === ref ? formatTime(t.slice(0, 5)) : `${dayNumber(d)} ${monthShort(d)}`
}

export function nowStamp(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${toIso(d)}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Días completos de `from` a `to` (negativo si `to` es anterior). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((fromIso(to).getTime() - fromIso(from).getTime()) / 86_400_000)
}

/** Lunes de la semana de esa fecha. */
export function mondayOf(iso: IsoDate): IsoDate {
  const wd = fromIso(iso).getDay()
  return addDays(iso, wd === 0 ? -6 : 1 - wd)
}

/** Cuánto falta para una cita: "Es hoy", "Es mañana", "Faltan 4 días". */
export function untilLabel(date: IsoDate, ref: IsoDate = today()): string {
  const n = daysBetween(ref, date)
  if (n < 0) return n === -1 ? 'Fue ayer' : `Hace ${-n} días`
  return n === 0 ? 'Es hoy' : n === 1 ? 'Es mañana' : `Faltan ${n} días`
}
