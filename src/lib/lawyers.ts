import type { Lawyer } from '../data/mock'
import type { Db, LawyerSettings } from './db'
import { DEFAULT_HOURS } from './db'

/** Precio, horario y forma de atención vigentes: lo que el abogado guardó o, si no, su ficha. */
export function effectiveSettings(db: Db, lawyer: Lawyer): LawyerSettings {
  return db.settings[lawyer.id] ?? { price: lawyer.consultationPrice, modes: lawyer.modes, ...DEFAULT_HOURS, bio: lawyer.bio, acceptsNew: true }
}

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export function daysLabel(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b)
  const consecutive = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1)
  if (sorted.length > 2 && consecutive) return `De ${DAY_NAMES[sorted[0]]} a ${DAY_NAMES[sorted[sorted.length - 1]]}`
  const names = sorted.map((d) => DAY_NAMES[d])
  const text = names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}` : names[0] ?? ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "En línea y presencial" */
export function modesLabel(modes: string[]): string {
  return modes.map((m, i) => (i === 0 ? m : m.toLowerCase())).join(' y ')
}
