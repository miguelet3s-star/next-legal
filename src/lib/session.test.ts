import { describe, expect, it } from 'vitest'
import type { Session } from './session'
import { areaOf, resolveAccess } from './session'

const cliente: Session = { role: 'cliente', userId: 'juan-perez' }
const abogado: Session = { role: 'abogado', userId: 'andrea-castillo' }

describe('áreas de la app', () => {
  it('reconoce a quién pertenece cada ruta', () => {
    expect(areaOf('/')).toBe('publica')
    expect(areaOf('/entrar')).toBe('publica')
    expect(areaOf('/inicio')).toBe('cliente')
    expect(areaOf('/casos/NL-2026-0458')).toBe('cliente')
    expect(areaOf('/abogado/andrea-castillo')).toBe('cliente')
    expect(areaOf('/despacho')).toBe('abogado')
    expect(areaOf('/despacho/casos/NL-2026-0458')).toBe('abogado')
  })

  it('no confunde rutas que solo empiezan parecido', () => {
    expect(areaOf('/despachos')).toBe('publica')
    expect(areaOf('/casosx')).toBe('publica')
  })
})

describe('acceso por tipo de cuenta', () => {
  it('sin sesión manda a iniciar sesión', () => {
    expect(resolveAccess('/inicio', null)).toEqual({ allow: false, redirect: '/entrar' })
    expect(resolveAccess('/despacho', null)).toEqual({ allow: false, redirect: '/entrar' })
  })

  it('el cliente no entra al despacho', () => {
    expect(resolveAccess('/despacho', cliente)).toEqual({ allow: false, redirect: '/inicio' })
    expect(resolveAccess('/despacho/casos/NL-2026-0458', cliente)).toEqual({ allow: false, redirect: '/inicio' })
    expect(resolveAccess('/casos', cliente)).toEqual({ allow: true })
  })

  it('el abogado no entra a las páginas del cliente', () => {
    for (const p of ['/inicio', '/buscar', '/abogado/valeria-paz', '/agendar/valeria-paz', '/casos', '/pagos', '/mensajes', '/perfil']) {
      expect(resolveAccess(p, abogado)).toEqual({ allow: false, redirect: '/despacho' })
    }
    expect(resolveAccess('/despacho/agenda', abogado)).toEqual({ allow: true })
  })

  it('las páginas públicas se ven siempre', () => {
    expect(resolveAccess('/', null)).toEqual({ allow: true })
    expect(resolveAccess('/entrar', abogado)).toEqual({ allow: true })
  })
})
