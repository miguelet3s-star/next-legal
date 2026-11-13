// Importes siempre en centavos (enteros). Nunca float para dinero.
export type Cents = number

export function formatLempiras(cents: Cents): string {
  if (!Number.isInteger(cents)) throw new Error('El importe debe ser un entero en centavos')
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const whole = Math.floor(abs / 100).toLocaleString('en-US')
  const dec = String(abs % 100).padStart(2, '0')
  return `${sign}L ${whole}.${dec}`
}

/** Comisión de plataforma en puntos básicos (1000 = 10 %), redondeo a centavo. */
export function platformFee(consultation: Cents, feeBps: number): Cents {
  return Math.round((consultation * feeBps) / 10_000)
}

export function bookingTotal(consultation: Cents, feeBps: number) {
  const fee = platformFee(consultation, feeBps)
  return { consultation, fee, total: consultation + fee }
}

/** "1,200" o "1200.50" → centavos. Devuelve null si no es un importe válido. */
export function parseLempiras(raw: string): Cents | null {
  const s = raw.replace(/[L\s,]/g, '')
  const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(s)
  if (!m) return null
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'))
}
