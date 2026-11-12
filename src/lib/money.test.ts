import { describe, expect, it } from 'vitest'
import { bookingTotal, formatLempiras, platformFee } from './money'

describe('money', () => {
  it('formatea lempiras desde centavos', () => {
    expect(formatLempiras(110_000)).toBe('L 1,100.00')
    expect(formatLempiras(5)).toBe('L 0.05')
    expect(formatLempiras(-2550)).toBe('-L 25.50')
  })

  it('rechaza importes no enteros', () => {
    expect(() => formatLempiras(10.5)).toThrow()
  })

  it('calcula comisión del 10 % y total', () => {
    expect(platformFee(100_000, 1000)).toBe(10_000)
    expect(bookingTotal(100_000, 1000)).toEqual({ consultation: 100_000, fee: 10_000, total: 110_000 })
  })

  it('redondea la comisión al centavo', () => {
    expect(platformFee(333, 1000)).toBe(33)
  })
})
