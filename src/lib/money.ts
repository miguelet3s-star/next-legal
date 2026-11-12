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
