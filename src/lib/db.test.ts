import { describe, expect, it } from 'vitest'
import type { Db } from './db'
import { consultationIcs } from './ics'
import { addCaseUpdate, addDoc, bookConsultation, cancelConsultation, completeConsultation, confirmConsultation, freeSlots, lawyerIncome, markThreadRead, netPaid, nextFreeSlot, weeklyIncome, openCase, saveSettings, scopeDb, seed, sendMessage, threadsOf } from './db'
import { parseLempiras } from './money'
import type { Session } from './session'

const REF = '2026-11-12' // jueves
const juan: Session = { role: 'cliente', userId: 'juan-perez' }
const marta: Session = { role: 'cliente', userId: 'marta-hernandez' }
const andrea: Session = { role: 'abogado', userId: 'andrea-castillo' }
const daniela: Session = { role: 'abogado', userId: 'daniela-funez' }

const booking = { id: 'nueva', paymentId: 'pago-nuevo', clientId: 'juan-perez', lawyerId: 'andrea-castillo', date: '2026-11-18', time: '09:00', mode: 'En línea' as const, topic: ' Consulta ', price: 100_000, method: 'Visa terminada en 4242', today: REF }

describe('lo que ve cada persona', () => {
  const db = seed(REF)

  it('un cliente solo ve lo suyo', () => {
    const mine = scopeDb(db, juan)
    expect(mine.cases.length).toBeGreaterThan(0)
    expect(mine.cases.every((c) => c.clientId === 'juan-perez')).toBe(true)
    expect(mine.consultations.every((c) => c.clientId === 'juan-perez')).toBe(true)
    expect(mine.messages.every((m) => m.clientId === 'juan-perez')).toBe(true)
    expect(mine.payments.every((p) => p.clientId === 'juan-perez')).toBe(true)
    expect(mine.clients.map((c) => c.id)).toEqual(['juan-perez'])
    const caseIds = new Set(mine.cases.map((c) => c.id))
    expect(mine.docs.every((d) => caseIds.has(d.caseId))).toBe(true)
  })

  it('dos clientes del mismo abogado no se ven entre sí', () => {
    const a = scopeDb(db, juan), b = scopeDb(db, marta)
    const ids = (x: Db) => [...x.cases, ...x.consultations, ...x.messages, ...x.payments, ...x.docs].map((r) => r.id)
    expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([])
  })

  it('un abogado solo ve a sus clientes y sus casos', () => {
    const mine = scopeDb(db, andrea)
    expect(mine.cases.every((c) => c.lawyerId === 'andrea-castillo')).toBe(true)
    expect(mine.cases.some((c) => c.id === 'NL-2026-0431')).toBe(false) // caso de otra abogada
    expect(mine.docs.some((d) => d.caseId === 'NL-2026-0431')).toBe(false)
    const other = scopeDb(db, daniela)
    expect(other.cases.map((c) => c.id)).toEqual(['NL-2026-0431'])
    expect(other.clients.map((c) => c.id)).toEqual(['juan-perez'])
    expect(Object.keys(other.settings)).toEqual([])
  })
})

describe('agendar y cobrar', () => {
  it('crea la consulta por confirmar y el cobro con comisión del 10 %', () => {
    const db = bookConsultation(seed(REF), booking)
    const c = db.consultations.find((x) => x.id === 'nueva')!
    expect(c).toMatchObject({ status: 'por-confirmar', price: 100_000, fee: 10_000, topic: 'Consulta' })
    expect(db.payments.find((p) => p.id === 'pago-nuevo')).toMatchObject({ kind: 'cobro', consultation: 100_000, fee: 10_000, total: 110_000 })
  })

  it('reintentar la misma operación no duplica la consulta ni el cobro', () => {
    const once = bookConsultation(seed(REF), booking)
    const twice = bookConsultation(once, booking)
    expect(twice).toBe(once)
    expect(twice.payments.filter((p) => p.consultationId === 'nueva')).toHaveLength(1)
  })

  it('no permite dos consultas a la misma hora con el mismo abogado', () => {
    const db = bookConsultation(seed(REF), booking)
    expect(() => bookConsultation(db, { ...booking, id: 'otra', paymentId: 'pago-otro', clientId: 'marta-hernandez' })).toThrow()
  })

  it('las horas tomadas dejan de ofrecerse y los días sin atención no tienen horas', () => {
    const base = seed(REF)
    const s = base.settings['andrea-castillo']
    expect(freeSlots(base, 'andrea-castillo', s, '2026-11-18')).toContain('09:00')
    const db = bookConsultation(base, booking)
    expect(freeSlots(db, 'andrea-castillo', s, '2026-11-18')).not.toContain('09:00')
    expect(freeSlots(db, 'andrea-castillo', s, '2026-11-15')).toEqual([]) // domingo
  })

  it('cancelar registra un reembolso completo y conserva el cobro original', () => {
    const booked = bookConsultation(seed(REF), booking)
    const before = netPaid(scopeDb(booked, juan).payments)
    const db = cancelConsultation(booked, 'nueva', 'reembolso-1', REF)
    expect(db.consultations.find((c) => c.id === 'nueva')!.status).toBe('cancelada')
    const moves = db.payments.filter((p) => p.consultationId === 'nueva')
    expect(moves.map((p) => p.kind)).toEqual(['cobro', 'reembolso'])
    expect(netPaid(scopeDb(db, juan).payments)).toBe(before - 110_000)
    // Cancelar otra vez no reembolsa dos veces.
    expect(cancelConsultation(db, 'nueva', 'reembolso-2', REF)).toBe(db)
  })

  it('una consulta realizada ya no se cancela', () => {
    const db = seed(REF)
    expect(cancelConsultation(db, 'c1', 'r', REF)).toBe(db)
  })

  it('confirmar y realizar siguen su orden', () => {
    let db = bookConsultation(seed(REF), booking)
    expect(completeConsultation(db, 'nueva')).toBe(db) // aún sin confirmar
    db = confirmConsultation(db, 'nueva')
    db = completeConsultation(db, 'nueva')
    expect(db.consultations.find((c) => c.id === 'nueva')!.status).toBe('realizada')
  })

  it('los ingresos del abogado no incluyen la comisión ni las canceladas', () => {
    const db = scopeDb(seed(REF), andrea)
    const all = lawyerIncome(db.consultations)
    expect(all.earned).toBe(300_000) // c1, c8, c9
    expect(all.upcoming).toBe(300_000) // c2, c4, c5
    expect(lawyerIncome(db.consultations, '2026-11').upcoming).toBe(300_000)
  })
})

describe('ayudas de agenda e ingresos', () => {
  it('encuentra la primera hora libre saltando las ocupadas', () => {
    const db = seed(REF)
    const s = db.settings['andrea-castillo']
    expect(nextFreeSlot(db, 'andrea-castillo', s, REF)).toEqual({ date: '2026-11-13', time: '08:00' })
    const full = bookConsultation(db, { ...booking, id: 'a', paymentId: 'pa', date: '2026-11-13', time: '08:00' })
    expect(nextFreeSlot(full, 'andrea-castillo', s, REF)).toEqual({ date: '2026-11-13', time: '09:00' })
    expect(nextFreeSlot(db, 'andrea-castillo', { ...s, days: [] }, REF)).toBeNull()
  })

  it('suma lo ganado por semana, de lunes a domingo', () => {
    const weeks = weeklyIncome(scopeDb(seed(REF), andrea).consultations, REF, 6)
    expect(weeks).toHaveLength(6)
    expect(weeks[5]).toEqual({ start: '2026-11-09', total: 100_000 }) // c9, lunes 9 nov
    expect(weeks.reduce((a, w) => a + w.total, 0)).toBe(300_000)
  })

  it('arma la cita para el calendario con una hora de duración', () => {
    const c = seed(REF).consultations.find((x) => x.id === 'c2')!
    const ics = consultationIcs(c, 'Andrea Castillo', 'Videollamada')
    expect(ics).toContain('DTSTART:20261116T100000')
    expect(ics).toContain('DTEND:20261116T110000')
    expect(ics).toContain('SUMMARY:Consulta con Andrea Castillo')
  })
})

describe('casos', () => {
  it('solo el abogado del caso registra avances', () => {
    const db = seed(REF)
    const u = { id: 'nuevo', at: `${REF}T09:00`, title: 'Audiencia programada', detail: 'Ya hay fecha.', nextStep: 'Asistir a la audiencia', status: 'En progreso' as const }
    expect(addCaseUpdate(db, 'daniela-funez', 'NL-2026-0458', u)).toBe(db)
    const next = addCaseUpdate(db, 'andrea-castillo', 'NL-2026-0458', u)
    const c = next.cases.find((x) => x.id === 'NL-2026-0458')!
    expect(c.updates[0].title).toBe('Audiencia programada')
    expect(c.nextStep).toBe('Asistir a la audiencia')
    expect(addCaseUpdate(next, 'andrea-castillo', 'NL-2026-0458', u)).toBe(next)
  })

  it('abrir expediente crea el caso del cliente con número consecutivo', () => {
    const db = confirmConsultation(seed(REF), 'c6')
    const next = openCase(db, 'andrea-castillo', { consultationId: 'c6', title: 'Despido por embarazo', area: 'laboral', updateId: 'x', at: `${REF}T10:00` })
    const created = next.cases[0]
    expect(created).toMatchObject({ id: 'NL-2026-0459', clientId: 'karla-mejia', lawyerId: 'andrea-castillo', status: 'Pendiente' })
    expect(next.consultations.find((c) => c.id === 'c6')!.caseId).toBe('NL-2026-0459')
    expect(openCase(next, 'andrea-castillo', { consultationId: 'c6', title: 'Otra vez', area: 'laboral', updateId: 'y', at: `${REF}T10:00` })).toBe(next)
    expect(openCase(db, 'daniela-funez', { consultationId: 'c6', title: 'Ajeno', area: 'laboral', updateId: 'z', at: `${REF}T10:00` })).toBe(db)
  })

  it('nadie sube documentos a un caso ajeno', () => {
    const db = seed(REF)
    const doc = { id: 'doc-x', caseId: 'NL-2026-0458', name: 'a.pdf', sizeKb: 10, uploadedBy: 'cliente' as const, date: REF }
    expect(addDoc(db, marta, doc)).toBe(db)
    expect(addDoc(db, juan, doc).docs[0]).toMatchObject({ id: 'doc-x', uploadedBy: 'cliente' })
  })
})

describe('mensajes', () => {
  it('agrupa por conversación y cuenta los no leídos de quien lee', () => {
    const db = seed(REF)
    const mine = threadsOf(scopeDb(db, juan).messages, 'cliente')
    expect(mine[0]).toMatchObject({ lawyerId: 'andrea-castillo', unread: 1 })
    const read = markThreadRead(db, 'juan-perez', 'andrea-castillo', 'cliente')
    expect(threadsOf(scopeDb(read, juan).messages, 'cliente')[0].unread).toBe(0)
    expect(markThreadRead(read, 'juan-perez', 'andrea-castillo', 'cliente')).toBe(read)
  })

  it('no envía mensajes vacíos ni duplicados', () => {
    const db = seed(REF)
    const m = { id: 'x', clientId: 'juan-perez', lawyerId: 'andrea-castillo', from: 'cliente' as const, text: '  ', at: `${REF}T09:00` }
    expect(sendMessage(db, m)).toBe(db)
    const sent = sendMessage(db, { ...m, text: 'Hola' })
    expect(sent.messages.at(-1)).toMatchObject({ text: 'Hola', read: false })
    expect(sendMessage(sent, { ...m, text: 'Hola' })).toBe(sent)
  })
})

describe('perfil del abogado', () => {
  it('rechaza precios y horarios inválidos', () => {
    const db = seed(REF)
    const s = db.settings['andrea-castillo']
    expect(saveSettings(db, 'andrea-castillo', { ...s, price: 0 })).toBe(db)
    expect(saveSettings(db, 'andrea-castillo', { ...s, from: '17:00', to: '08:00' })).toBe(db)
    expect(saveSettings(db, 'andrea-castillo', { ...s, days: [] })).toBe(db)
    expect(saveSettings(db, 'andrea-castillo', { ...s, price: 120_000 }).settings['andrea-castillo'].price).toBe(120_000)
  })

  it('convierte lempiras escritos a centavos sin decimales flotantes', () => {
    expect(parseLempiras('1,200')).toBe(120_000)
    expect(parseLempiras('L 950.5')).toBe(95_050)
    expect(parseLempiras('0.07')).toBe(7)
    expect(parseLempiras('mil')).toBeNull()
    expect(parseLempiras('12.345')).toBeNull()
  })
})
