// Datos de la app (casos, consultas, mensajes, documentos y pagos) y sus reglas.
// Todo aquí son funciones puras: reciben los datos y devuelven una copia nueva.
// En el prototipo se guardan en el dispositivo (ver store.ts); con backend, estas mismas
// reglas se validan también en el servidor y cada fila se protege con Row Level Security.
import type { CategoryId } from '../data/mock'
import type { IsoDate } from './dates'
import { addDays, addWorkdays, formatLong, fromIso, hourSlots, mondayOf, nextOpenDays } from './dates'
import type { Cents } from './money'
import { platformFee } from './money'
import type { Role, Session } from './session'

export const PLATFORM_FEE_BPS = 1000 // 10 %

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  city: string
}

export type CaseStatus = 'En progreso' | 'En revisión' | 'Pendiente' | 'Cerrado'
export const CASE_STATUSES: CaseStatus[] = ['Pendiente', 'En revisión', 'En progreso', 'Cerrado']

export interface CaseUpdate {
  id: string
  /** AAAA-MM-DDTHH:MM */
  at: string
  title: string
  detail: string
}

export interface LegalCase {
  id: string
  title: string
  area: CategoryId
  status: CaseStatus
  clientId: string
  lawyerId: string
  openedAt: IsoDate
  nextStep: string
  /** Del más reciente al más antiguo. */
  updates: CaseUpdate[]
}

export type Mode = 'En línea' | 'Presencial'
export type ConsultationStatus = 'por-confirmar' | 'confirmada' | 'realizada' | 'cancelada'

export interface Consultation {
  id: string
  clientId: string
  lawyerId: string
  date: IsoDate
  time: string
  mode: Mode
  topic: string
  status: ConsultationStatus
  /** Precio y comisión tal como se cobraron. */
  price: Cents
  fee: Cents
  caseId?: string
}

export interface Message {
  id: string
  clientId: string
  lawyerId: string
  from: Role
  text: string
  at: string
  read: boolean
}

export interface Doc {
  id: string
  caseId: string
  name: string
  sizeKb: number
  uploadedBy: Role
  date: IsoDate
}

/** Los pagos no se editan ni se borran: una cancelación agrega un movimiento de reembolso. */
export interface Payment {
  id: string
  consultationId: string
  clientId: string
  lawyerId: string
  kind: 'cobro' | 'reembolso'
  consultation: Cents
  fee: Cents
  total: Cents
  date: IsoDate
  method: string
}

export interface LawyerSettings {
  price: Cents
  modes: Mode[]
  /** Días de atención, 0 = domingo. */
  days: number[]
  from: string
  to: string
  bio: string
  acceptsNew: boolean
}

export interface ClientPrefs {
  whatsapp: boolean
  email: boolean
}

export interface Db {
  clients: Client[]
  cases: LegalCase[]
  consultations: Consultation[]
  messages: Message[]
  docs: Doc[]
  payments: Payment[]
  settings: Record<string, LawyerSettings>
  prefs: Record<string, ClientPrefs>
}

export const DEFAULT_HOURS = { days: [1, 2, 3, 4, 5], from: '08:00', to: '17:00' }

// ---------- Lo que ve cada persona ----------

/**
 * Deja solo las filas de quien tiene la sesión. Ninguna pantalla lee los datos completos:
 * un cliente no ve casos de otro cliente y un abogado solo ve a sus propios clientes.
 */
export function scopeDb(db: Db, me: Session): Db {
  const mine = (r: { clientId: string; lawyerId: string }) => (me.role === 'cliente' ? r.clientId === me.userId : r.lawyerId === me.userId)
  const cases = db.cases.filter(mine)
  const consultations = db.consultations.filter(mine)
  const messages = db.messages.filter(mine)
  const caseIds = new Set(cases.map((c) => c.id))
  const clientIds = me.role === 'cliente' ? new Set([me.userId]) : new Set([...cases, ...consultations, ...messages].map((r) => r.clientId))
  return {
    clients: db.clients.filter((c) => clientIds.has(c.id)),
    cases,
    consultations,
    messages,
    docs: db.docs.filter((d) => caseIds.has(d.caseId)),
    payments: db.payments.filter(mine),
    // El perfil público de los abogados (precio y horario) lo puede ver cualquier cliente.
    settings: me.role === 'cliente' ? db.settings : pick(db.settings, me.userId),
    prefs: me.role === 'cliente' ? pick(db.prefs, me.userId) : {},
  }
}

function pick<T>(rec: Record<string, T>, key: string): Record<string, T> {
  return key in rec ? { [key]: rec[key] } : {}
}

// ---------- Agenda ----------

const BUSY: ConsultationStatus[] = ['por-confirmar', 'confirmada', 'realizada']

export function openDays(settings: LawyerSettings, ref: IsoDate, count = 5): IsoDate[] {
  return nextOpenDays(ref, settings.days, count)
}

/** Horas libres del abogado ese día: su horario menos las consultas ya tomadas. */
export function freeSlots(db: Db, lawyerId: string, settings: LawyerSettings, date: IsoDate): string[] {
  if (!settings.days.includes(fromIso(date).getDay())) return []
  const taken = new Set(db.consultations.filter((c) => c.lawyerId === lawyerId && c.date === date && BUSY.includes(c.status)).map((c) => c.time))
  return hourSlots(settings.from, settings.to).filter((s) => !taken.has(s))
}

/** Primera hora libre del abogado en sus próximos días de atención. */
export function nextFreeSlot(db: Db, lawyerId: string, settings: LawyerSettings, ref: IsoDate): { date: IsoDate; time: string } | null {
  for (const date of nextOpenDays(ref, settings.days, 10)) {
    const time = freeSlots(db, lawyerId, settings, date)[0]
    if (time) return { date, time }
  }
  return null
}

// ---------- Consultas y pagos ----------

export interface BookingInput {
  id: string
  paymentId: string
  clientId: string
  lawyerId: string
  date: IsoDate
  time: string
  mode: Mode
  topic: string
  price: Cents
  method: string
  today: IsoDate
}

/** Agenda y cobra una consulta. Repetir la misma operación (mismo id) no la duplica. */
export function bookConsultation(db: Db, b: BookingInput): Db {
  if (db.consultations.some((c) => c.id === b.id)) return db
  const slotTaken = db.consultations.some((c) => c.lawyerId === b.lawyerId && c.date === b.date && c.time === b.time && BUSY.includes(c.status))
  if (slotTaken) throw new Error('Esa hora ya está ocupada. Elija otra.')
  if (!Number.isInteger(b.price) || b.price <= 0) throw new Error('Precio inválido')
  const fee = platformFee(b.price, PLATFORM_FEE_BPS)
  const consultation: Consultation = { id: b.id, clientId: b.clientId, lawyerId: b.lawyerId, date: b.date, time: b.time, mode: b.mode, topic: b.topic.trim().slice(0, 400), status: 'por-confirmar', price: b.price, fee }
  const payment: Payment = { id: b.paymentId, consultationId: b.id, clientId: b.clientId, lawyerId: b.lawyerId, kind: 'cobro', consultation: b.price, fee, total: b.price + fee, date: b.today, method: b.method }
  return { ...db, consultations: [...db.consultations, consultation], payments: [...db.payments, payment] }
}

function setStatus(db: Db, id: string, from: ConsultationStatus[], to: ConsultationStatus): Db {
  const c = db.consultations.find((x) => x.id === id)
  if (!c || !from.includes(c.status)) return db
  return { ...db, consultations: db.consultations.map((x) => (x.id === id ? { ...x, status: to } : x)) }
}

export function confirmConsultation(db: Db, id: string): Db {
  return setStatus(db, id, ['por-confirmar'], 'confirmada')
}

export function completeConsultation(db: Db, id: string): Db {
  return setStatus(db, id, ['confirmada'], 'realizada')
}

/** Cancela una consulta aún no realizada y registra el reembolso completo. */
export function cancelConsultation(db: Db, id: string, refundId: string, today: IsoDate): Db {
  const next = setStatus(db, id, ['por-confirmar', 'confirmada'], 'cancelada')
  if (next === db) return db
  const charge = db.payments.find((p) => p.consultationId === id && p.kind === 'cobro')
  const refunded = db.payments.some((p) => p.consultationId === id && p.kind === 'reembolso')
  if (!charge || refunded) return next
  return { ...next, payments: [...next.payments, { ...charge, id: refundId, kind: 'reembolso', date: today }] }
}

/** Lo que el cliente ha pagado en total: cobros menos reembolsos. */
export function netPaid(payments: Payment[]): Cents {
  return payments.reduce((sum, p) => sum + (p.kind === 'cobro' ? p.total : -p.total), 0)
}

/** Ingresos del abogado: el precio de sus consultas, sin la comisión que paga el cliente. */
export function lawyerIncome(consultations: Consultation[], monthPrefix?: string): { earned: Cents; upcoming: Cents } {
  const inMonth = consultations.filter((c) => !monthPrefix || c.date.startsWith(monthPrefix))
  const sum = (s: ConsultationStatus) => inMonth.filter((c) => c.status === s).reduce((a, c) => a + c.price, 0)
  return { earned: sum('realizada'), upcoming: sum('confirmada') }
}

/** Lo ganado (consultas realizadas) en cada una de las últimas `weeks` semanas, de la más antigua a la actual. */
export function weeklyIncome(consultations: Consultation[], ref: IsoDate, weeks = 6): { start: IsoDate; total: Cents }[] {
  const current = mondayOf(ref)
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(current, -7 * (weeks - 1 - i))
    const end = addDays(start, 7)
    const total = consultations.filter((c) => c.status === 'realizada' && c.date >= start && c.date < end).reduce((a, c) => a + c.price, 0)
    return { start, total }
  })
}

/** Etapa del caso en su ruta: 0 abierto, 1 en revisión, 2 en trámite, 3 resuelto. */
export function caseStage(status: CaseStatus): number {
  return CASE_STATUSES.indexOf(status)
}
export const CASE_ROUTE = ['Abierto', 'En revisión', 'En trámite', 'Resuelto']

// ---------- Casos ----------

export function nextCaseId(db: Db, year: number): string {
  const max = db.cases.reduce((m, c) => Math.max(m, Number(c.id.split('-')[2]) || 0), 0)
  return `NL-${year}-${String(max + 1).padStart(4, '0')}`
}

export interface NewCase {
  consultationId: string
  title: string
  area: CategoryId
  updateId: string
  at: string
}

/** El abogado abre un expediente a partir de una consulta suya. */
export function openCase(db: Db, lawyerId: string, n: NewCase): Db {
  const c = db.consultations.find((x) => x.id === n.consultationId)
  const title = n.title.trim()
  if (!c || c.lawyerId !== lawyerId || c.caseId || c.status === 'cancelada' || title.length < 3) return db
  const date = n.at.slice(0, 10)
  const id = nextCaseId(db, Number(date.slice(0, 4)))
  const legalCase: LegalCase = {
    id, title: title.slice(0, 80), area: n.area, status: 'Pendiente', clientId: c.clientId, lawyerId, openedAt: date,
    nextStep: 'Reunir los documentos del caso',
    updates: [{ id: n.updateId, at: n.at, title: 'Expediente abierto', detail: 'Su abogado abrió el expediente y comenzó a trabajar en su caso.' }],
  }
  return { ...db, cases: [legalCase, ...db.cases], consultations: db.consultations.map((x) => (x.id === c.id ? { ...x, caseId: id } : x)) }
}

export interface UpdateInput {
  id: string
  at: string
  title: string
  detail: string
  nextStep?: string
  status?: CaseStatus
}

/** Solo el abogado del caso registra avances; el cliente los ve en su línea de tiempo. */
export function addCaseUpdate(db: Db, lawyerId: string, caseId: string, u: UpdateInput): Db {
  const title = u.title.trim()
  const target = db.cases.find((c) => c.id === caseId)
  if (!target || target.lawyerId !== lawyerId || title.length < 3) return db
  if (target.updates.some((x) => x.id === u.id)) return db
  const update: CaseUpdate = { id: u.id, at: u.at, title: title.slice(0, 80), detail: u.detail.trim().slice(0, 600) }
  return {
    ...db,
    cases: db.cases.map((c) => (c.id === caseId ? { ...c, updates: [update, ...c.updates], nextStep: u.nextStep?.trim() || c.nextStep, status: u.status ?? c.status } : c)),
  }
}

export function addDoc(db: Db, me: Session, doc: Doc): Db {
  const c = db.cases.find((x) => x.id === doc.caseId)
  const isMine = c && (me.role === 'cliente' ? c.clientId === me.userId : c.lawyerId === me.userId)
  if (!isMine || db.docs.some((d) => d.id === doc.id)) return db
  return { ...db, docs: [{ ...doc, uploadedBy: me.role }, ...db.docs] }
}

// ---------- Mensajes ----------

export interface Thread {
  clientId: string
  lawyerId: string
  last: Message
  unread: number
}

/** Conversaciones de quien tiene la sesión, la más reciente primero. */
export function threadsOf(messages: Message[], reader: Role): Thread[] {
  const map = new Map<string, Thread>()
  for (const m of messages) {
    const key = `${m.clientId}|${m.lawyerId}`
    const t = map.get(key)
    const unread = m.from !== reader && !m.read ? 1 : 0
    if (!t) map.set(key, { clientId: m.clientId, lawyerId: m.lawyerId, last: m, unread })
    else { t.unread += unread; if (m.at >= t.last.at) t.last = m }
  }
  return [...map.values()].sort((a, b) => b.last.at.localeCompare(a.last.at))
}

export function sendMessage(db: Db, m: Omit<Message, 'read'>): Db {
  const text = m.text.trim().slice(0, 1000)
  if (!text || db.messages.some((x) => x.id === m.id)) return db
  return { ...db, messages: [...db.messages, { ...m, text, read: false }] }
}

export function markThreadRead(db: Db, clientId: string, lawyerId: string, reader: Role): Db {
  const pending = (m: Message) => m.clientId === clientId && m.lawyerId === lawyerId && m.from !== reader && !m.read
  if (!db.messages.some(pending)) return db
  return { ...db, messages: db.messages.map((m) => (pending(m) ? { ...m, read: true } : m)) }
}

// ---------- Perfiles ----------

export function saveSettings(db: Db, lawyerId: string, s: LawyerSettings): Db {
  if (!Number.isInteger(s.price) || s.price <= 0 || s.modes.length === 0 || s.days.length === 0 || s.from >= s.to) return db
  return { ...db, settings: { ...db.settings, [lawyerId]: { ...s, bio: s.bio.trim().slice(0, 400) } } }
}

export function saveClient(db: Db, client: Client): Db {
  return { ...db, clients: db.clients.map((c) => (c.id === client.id ? client : c)) }
}

export function savePrefs(db: Db, clientId: string, prefs: ClientPrefs): Db {
  return { ...db, prefs: { ...db.prefs, [clientId]: prefs } }
}

// ---------- Datos iniciales ----------

/** Datos con los que arranca el prototipo, con fechas alrededor de `ref` (hoy). */
export function seed(ref: IsoDate): Db {
  const d = (n: number) => addDays(ref, n)
  // Las consultas caen en días hábiles, dentro del horario de atención.
  const w = (n: number) => addWorkdays(ref, n)
  const J = 'juan-perez', A = 'andrea-castillo'
  const fee = (p: Cents) => platformFee(p, PLATFORM_FEE_BPS)
  const pay = (id: string, consultationId: string, clientId: string, lawyerId: string, price: Cents, date: IsoDate): Payment =>
    ({ id, consultationId, clientId, lawyerId, kind: 'cobro', consultation: price, fee: fee(price), total: price + fee(price), date, method: 'Visa terminada en 4242' })
  const con = (id: string, clientId: string, lawyerId: string, date: IsoDate, time: string, mode: Mode, topic: string, status: ConsultationStatus, price: Cents, caseId?: string): Consultation =>
    ({ id, clientId, lawyerId, date, time, mode, topic, status, price, fee: fee(price), caseId })

  return {
    clients: [
      { id: J, name: 'Juan Pérez', phone: '+504 9876-5432', email: 'juan.perez@gmail.com', city: 'Tegucigalpa' },
      { id: 'marta-hernandez', name: 'Marta Hernández', phone: '+504 9612-4478', email: 'marta.hdez@gmail.com', city: 'Tegucigalpa' },
      { id: 'oscar-flores', name: 'Óscar Flores', phone: '+504 3345-9021', email: 'oscarflores@outlook.com', city: 'Comayagua' },
      { id: 'karla-mejia', name: 'Karla Mejía', phone: '+504 8890-1265', email: 'karla.mejia@gmail.com', city: 'Tegucigalpa' },
      { id: 'jose-banegas', name: 'José Banegas', phone: '+504 9455-7730', email: 'jbanegas@yahoo.com', city: 'Choluteca' },
    ],
    cases: [
      {
        id: 'NL-2026-0458', title: 'Despido sin pago de prestaciones', area: 'laboral', status: 'En progreso', clientId: J, lawyerId: A, openedAt: d(-24),
        nextStep: `Audiencia de conciliación el ${formatLong(w(4))}`,
        updates: [
          { id: 'u1', at: `${d(-2)}T10:30`, title: 'Demanda aceptada', detail: 'El juzgado aceptó la demanda y le asignó número de expediente.' },
          { id: 'u2', at: `${d(-9)}T11:00`, title: 'Demanda presentada', detail: 'Se presentó la demanda en el Juzgado de Letras del Trabajo.' },
          { id: 'u3', at: `${d(-16)}T15:20`, title: 'Documentos revisados', detail: 'Se revisaron su contrato, la carta de despido y sus comprobantes de pago.' },
          { id: 'u4', at: `${d(-24)}T09:00`, title: 'Expediente abierto', detail: 'Su abogado abrió el expediente y comenzó a trabajar en su caso.' },
        ],
      },
      {
        id: 'NL-2026-0431', title: 'Divorcio de mutuo acuerdo', area: 'familia', status: 'En revisión', clientId: J, lawyerId: 'daniela-funez', openedAt: d(-40),
        nextStep: 'Firmar el convenio cuando esté listo',
        updates: [
          { id: 'u5', at: `${d(-5)}T16:00`, title: 'Convenio en revisión', detail: 'La abogada revisa el convenio de divorcio antes de la firma.' },
          { id: 'u6', at: `${d(-40)}T10:00`, title: 'Expediente abierto', detail: 'Su abogado abrió el expediente y comenzó a trabajar en su caso.' },
        ],
      },
      {
        id: 'NL-2026-0447', title: 'Pago de horas extra', area: 'laboral', status: 'En progreso', clientId: 'marta-hernandez', lawyerId: A, openedAt: d(-31),
        nextStep: 'Esperar la respuesta de la empresa',
        updates: [
          { id: 'u7', at: `${d(-12)}T09:40`, title: 'Reclamo enviado a la empresa', detail: 'Se envió el reclamo formal con el cálculo de las horas extra.' },
          { id: 'u8', at: `${d(-31)}T14:00`, title: 'Expediente abierto', detail: 'Su abogado abrió el expediente y comenzó a trabajar en su caso.' },
        ],
      },
      {
        id: 'NL-2026-0452', title: 'Acoso laboral', area: 'laboral', status: 'En revisión', clientId: 'oscar-flores', lawyerId: A, openedAt: d(-18),
        nextStep: 'Reunir los testimonios de dos compañeros',
        updates: [
          { id: 'u9', at: `${d(-18)}T11:15`, title: 'Expediente abierto', detail: 'Su abogado abrió el expediente y comenzó a trabajar en su caso.' },
        ],
      },
    ],
    consultations: [
      con('c1', J, A, w(-18), '10:00', 'En línea', 'Me despidieron y no me pagaron mis prestaciones.', 'realizada', 100_000, 'NL-2026-0458'),
      con('c2', J, A, w(2), '10:00', 'En línea', 'Preparar la audiencia de conciliación.', 'confirmada', 100_000, 'NL-2026-0458'),
      con('c3', J, 'daniela-funez', w(-29), '14:00', 'Presencial', 'Queremos divorciarnos de mutuo acuerdo.', 'realizada', 95_000, 'NL-2026-0431'),
      con('c4', 'marta-hernandez', A, d(0), '09:00', 'Presencial', 'Revisar la respuesta de la empresa.', 'confirmada', 100_000, 'NL-2026-0447'),
      con('c5', 'oscar-flores', A, d(0), '14:00', 'En línea', 'Seguimiento del caso de acoso.', 'confirmada', 100_000, 'NL-2026-0452'),
      con('c6', 'karla-mejia', A, w(3), '11:00', 'En línea', 'Estoy embarazada y me quieren despedir. Quiero saber qué derechos tengo.', 'por-confirmar', 100_000),
      con('c7', 'jose-banegas', A, w(4), '15:00', 'Presencial', 'Trabajé seis años y no me quieren pagar el décimo tercer mes.', 'por-confirmar', 100_000),
      con('c8', 'marta-hernandez', A, w(-22), '09:00', 'Presencial', 'No me pagan las horas extra.', 'realizada', 100_000, 'NL-2026-0447'),
      con('c9', 'oscar-flores', A, w(-3), '16:00', 'En línea', 'Mi jefe me trata mal frente a todos.', 'realizada', 100_000, 'NL-2026-0452'),
    ],
    messages: [
      { id: 'm1', clientId: J, lawyerId: A, from: 'abogado', text: 'Buenos días, don Juan. El juzgado aceptó la demanda.', at: `${d(-2)}T10:35`, read: true },
      { id: 'm2', clientId: J, lawyerId: A, from: 'cliente', text: 'Qué buena noticia, abogada. ¿Qué sigue ahora?', at: `${d(-2)}T10:52`, read: true },
      { id: 'm3', clientId: J, lawyerId: A, from: 'abogado', text: 'Sigue la audiencia de conciliación. En nuestra próxima consulta la preparamos juntos.', at: `${d(-1)}T08:15`, read: false },
      { id: 'm4', clientId: J, lawyerId: 'daniela-funez', from: 'abogado', text: 'Le aviso en cuanto el convenio esté listo para firmar.', at: `${d(-5)}T16:10`, read: true },
      { id: 'm5', clientId: 'marta-hernandez', lawyerId: A, from: 'cliente', text: 'Abogada, la empresa me llamó ayer. ¿Lo vemos hoy en la consulta?', at: `${d(-1)}T17:40`, read: false },
      { id: 'm6', clientId: 'oscar-flores', lawyerId: A, from: 'abogado', text: 'Don Óscar, recuerde traer los nombres de sus dos compañeros.', at: `${d(-3)}T12:00`, read: true },
      { id: 'm7', clientId: 'oscar-flores', lawyerId: A, from: 'cliente', text: 'Sí, abogada, ya hablé con ellos.', at: `${d(-3)}T12:30`, read: true },
    ],
    docs: [
      { id: 'd1', caseId: 'NL-2026-0458', name: 'Demanda laboral.pdf', sizeKb: 412, uploadedBy: 'abogado', date: d(-9) },
      { id: 'd2', caseId: 'NL-2026-0458', name: 'Carta de despido.pdf', sizeKb: 186, uploadedBy: 'cliente', date: d(-22) },
      { id: 'd3', caseId: 'NL-2026-0458', name: 'Contrato de trabajo.pdf', sizeKb: 640, uploadedBy: 'cliente', date: d(-22) },
      { id: 'd4', caseId: 'NL-2026-0431', name: 'Borrador del convenio.pdf', sizeKb: 298, uploadedBy: 'abogado', date: d(-5) },
      { id: 'd5', caseId: 'NL-2026-0447', name: 'Cálculo de horas extra.pdf', sizeKb: 154, uploadedBy: 'abogado', date: d(-12) },
      { id: 'd6', caseId: 'NL-2026-0452', name: 'Capturas de mensajes.jpg', sizeKb: 2210, uploadedBy: 'cliente', date: d(-17) },
    ],
    payments: [
      pay('p1', 'c1', J, A, 100_000, d(-27)),
      pay('p2', 'c2', J, A, 100_000, d(-3)),
      pay('p3', 'c3', J, 'daniela-funez', 95_000, d(-43)),
      pay('p4', 'c4', 'marta-hernandez', A, 100_000, d(-4)),
      pay('p5', 'c5', 'oscar-flores', A, 100_000, d(-5)),
      pay('p6', 'c6', 'karla-mejia', A, 100_000, d(-1)),
      pay('p7', 'c7', 'jose-banegas', A, 100_000, d(0)),
      pay('p8', 'c8', 'marta-hernandez', A, 100_000, d(-33)),
      pay('p9', 'c9', 'oscar-flores', A, 100_000, d(-20)),
    ],
    settings: {
      [A]: { price: 100_000, modes: ['En línea', 'Presencial'], ...DEFAULT_HOURS, bio: 'Defiende a trabajadores que fueron despedidos o a quienes no les pagaron lo justo.', acceptsNew: true },
    },
    prefs: { [J]: { whatsapp: true, email: true } },
  }
}
