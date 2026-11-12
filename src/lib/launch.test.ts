import { describe, expect, it } from 'vitest'
import { LAUNCH_DATE, isLaunched, timeLeft } from './launch'
import { renderWelcomeEmail, welcomeSubject } from '../emails/bienvenida'

describe('timeLeft', () => {
  it('calcula días, horas y minutos restantes', () => {
    const now = new Date('2026-11-12T09:00:00-06:00')
    expect(timeLeft(LAUNCH_DATE, now)).toEqual({ days: 21, hours: 0, minutes: 0, seconds: 0, done: false })
    expect(timeLeft(new Date(now.getTime() + 90_061_000), now)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1, done: false })
  })
  it('no baja de cero después del lanzamiento', () => {
    expect(timeLeft(LAUNCH_DATE, new Date('2027-01-01T00:00:00Z'))).toMatchObject({ days: 0, hours: 0, done: true })
  })
})

describe('correo de bienvenida', () => {
  const now = new Date('2026-11-12T09:00:00-06:00')
  it('incluye nombre, folio, correo y la cuenta regresiva', () => {
    const html = renderWelcomeEmail({ name: 'Carla Mejía', email: 'carla@gmail.com', folio: '0328', role: 'cliente', interest: 'Despido o salario', now })
    expect(html).toContain('Le damos la bienvenida a Next Legal, Carla.')
    expect(html).toContain('N.º 0328')
    expect(html).toContain('carla@gmail.com')
    expect(html).toContain('Faltan 21 días, 00 horas y 00 minutos')
    expect(welcomeSubject({ name: 'Carla Mejía', folio: '0328' })).toBe('Carla, su lugar en Next Legal está apartado (N.º 0328)')
  })
  it('escapa el contenido del usuario', () => {
    const html = renderWelcomeEmail({ name: '<script>x</script>', email: 'a@b.co', folio: '0001', role: 'abogado', now })
    expect(html).not.toContain('<script>x')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('isLaunched', () => {
  it('cambia a lanzado en la fecha o con ?lanzado=1', () => {
    expect(isLaunched(new Date('2026-11-12T12:00:00Z'), '')).toBe(false)
    expect(isLaunched(new Date('2026-12-03T15:00:01Z'), '')).toBe(true)
    expect(isLaunched(new Date('2026-11-12T12:00:00Z'), '?lanzado=1')).toBe(true)
  })
})
