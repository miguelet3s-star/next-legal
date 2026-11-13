import { describe, expect, it } from 'vitest'
import { addDays, addWorkdays, formatLong, formatShort, formatStamp, formatTime, hourSlots, nextOpenDays, relativeDay } from './dates'

describe('fechas', () => {
  it('suma días cruzando mes y año', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('suma días hábiles saltando el fin de semana', () => {
    expect(addWorkdays('2026-11-12', 0)).toBe('2026-11-12')
    expect(addWorkdays('2026-11-12', 2)).toBe('2026-11-16') // jueves + 2 = lunes
    expect(addWorkdays('2026-11-16', -1)).toBe('2026-11-13') // lunes - 1 = viernes
  })

  it('escribe las fechas en español', () => {
    expect(formatLong('2026-11-12')).toBe('jueves 12 de noviembre')
    expect(formatShort('2026-11-12')).toBe('12 nov 2026')
    expect(relativeDay('2026-11-12', '2026-11-12')).toBe('Hoy')
    expect(relativeDay('2026-11-13', '2026-11-12')).toBe('Mañana')
    expect(relativeDay('2026-11-11', '2026-11-12')).toBe('Ayer')
    expect(relativeDay('2026-11-20', '2026-11-12')).toBe('viernes 20 de noviembre')
  })

  it('escribe las horas en formato de 12 horas', () => {
    expect(formatTime('00:00')).toBe('12:00 a.m.')
    expect(formatTime('09:05')).toBe('9:05 a.m.')
    expect(formatTime('12:00')).toBe('12:00 p.m.')
    expect(formatTime('14:30')).toBe('2:30 p.m.')
    expect(formatStamp('2026-11-12T14:30', '2026-11-12')).toBe('2:30 p.m.')
    expect(formatStamp('2026-11-10T14:30', '2026-11-12')).toBe('10 nov')
  })

  it('ofrece solo los días de atención, desde mañana', () => {
    // 12 nov 2026 es jueves; lunes a viernes.
    expect(nextOpenDays('2026-11-12', [1, 2, 3, 4, 5], 3)).toEqual(['2026-11-13', '2026-11-16', '2026-11-17'])
    expect(nextOpenDays('2026-11-12', [], 3)).toEqual([])
  })

  it('arma las horas del horario', () => {
    expect(hourSlots('08:00', '11:00')).toEqual(['08:00', '09:00', '10:00'])
    expect(hourSlots('10:00', '10:00')).toEqual([])
  })
})
