import { describe, expect, it } from 'vitest'
import { leadsToCsv, normalizeHnPhone, validateLead } from './leads'

describe('normalizeHnPhone', () => {
  it('acepta celulares y fijos hondureños', () => {
    expect(normalizeHnPhone('9876-5432')).toBe('+504 9876-5432')
    expect(normalizeHnPhone('+504 3312 4455')).toBe('+504 3312-4455')
    expect(normalizeHnPhone('22345678')).toBe('+504 2234-5678')
  })
  it('rechaza números inválidos', () => {
    expect(normalizeHnPhone('1234567')).toBeNull()
    expect(normalizeHnPhone('12345678')).toBeNull()
    expect(normalizeHnPhone('')).toBeNull()
  })
})

describe('validateLead', () => {
  it('limpia y valida', () => {
    const r = validateLead({ name: '  Ana   Pérez ', phone: '98765432', email: '', via: 'whatsapp', role: 'cliente', need: ' despido ' })
    expect(r).toEqual({ ok: true, value: { name: 'Ana Pérez', phone: '+504 9876-5432', email: '', via: 'whatsapp', role: 'cliente', need: 'despido' } })
  })
  it('reporta errores', () => {
    const r = validateLead({ name: 'A', phone: '1', email: '', via: 'whatsapp', role: 'cliente', need: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['name', 'phone'])
  })
})

describe('registro por correo', () => {
  it('exige un correo válido y deja el WhatsApp opcional', () => {
    const ok = validateLead({ name: 'Luis Mejía', phone: '', email: ' Luis@Gmail.com ', via: 'correo', role: 'cliente', need: '' })
    expect(ok).toEqual({ ok: true, value: { name: 'Luis Mejía', phone: '', email: 'luis@gmail.com', via: 'correo', role: 'cliente', need: '' } })
    const bad = validateLead({ name: 'Luis Mejía', phone: '', email: 'luis@', via: 'correo', role: 'cliente', need: '' })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(Object.keys(bad.errors)).toEqual(['email'])
  })
  it('rechaza un WhatsApp opcional mal escrito', () => {
    const r = validateLead({ name: 'Luis Mejía', phone: '123', email: 'luis@gmail.com', via: 'correo', role: 'cliente', need: '' })
    expect(r.ok).toBe(false)
  })
})

describe('leadsToCsv', () => {
  it('escapa comillas y neutraliza fórmulas', () => {
    const csv = leadsToCsv([{ id: '1', name: '=HACK()', phone: '+504 9876-5432', email: '', via: 'whatsapp', role: 'cliente', need: 'dice "hola"', createdAt: '2026-11-17T22:00:00Z' }])
    expect(csv).toContain(`"'=HACK()"`)
    expect(csv).toContain('"dice ""hola"""')
    expect(csv).toContain(`"'+504 9876-5432"`)
  })
})
