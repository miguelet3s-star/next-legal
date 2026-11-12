// Registro de interesados del kiosko. Se guarda SOLO en este dispositivo (localStorage)
// hasta que exista backend. Exportable a CSV desde /kiosko/registros.

export type LeadRole = 'cliente' | 'abogado'

export type LeadVia = 'correo' | 'whatsapp'

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  via: LeadVia
  role: LeadRole
  need: string
  createdAt: string
}

const KEY = 'nextlegal.leads.v1'

export interface LeadInput {
  name: string
  phone: string
  email: string
  via: LeadVia
  role: LeadRole
  need: string
}

export type LeadErrors = Partial<Record<keyof LeadInput, string>>

/** Teléfono hondureño: 8 dígitos que empiezan en 2, 3, 7, 8 o 9 (opcional +504). */
export function normalizeHnPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('504')) d = d.slice(3)
  if (!/^[23789]\d{7}$/.test(d)) return null
  return `+504 ${d.slice(0, 4)}-${d.slice(4)}`
}

export function isEmail(v: string): boolean {
  return v.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
}

export function validateLead(input: LeadInput): { ok: true; value: LeadInput } | { ok: false; errors: LeadErrors } {
  const errors: LeadErrors = {}
  const name = input.name.trim().replace(/\s+/g, ' ')
  if (name.length < 3) errors.name = 'Escriba su nombre'
  else if (name.length > 80) errors.name = 'Nombre demasiado largo'
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.trim() ? normalizeHnPhone(input.phone) : ''
  if (input.via === 'correo') {
    if (!isEmail(email)) errors.email = 'Escriba un correo válido, por ejemplo nombre@gmail.com'
    if (phone === null) errors.phone = 'Número hondureño de 8 dígitos'
  } else {
    if (!phone) errors.phone = 'Número hondureño de 8 dígitos'
    if (email && !isEmail(email)) errors.email = 'Escriba un correo válido'
  }
  if (input.role !== 'cliente' && input.role !== 'abogado') errors.role = 'Elija una opción'
  if (Object.keys(errors).length) return { ok: false, errors }
  return { ok: true, value: { name, phone: phone ?? '', email, via: input.via, role: input.role, need: input.need.trim().slice(0, 200) } }
}

function read(): Lead[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Lead[]) : []
  } catch {
    return []
  }
}

export function listLeads(): Lead[] {
  return read()
}

export function formatFolio(n: number) {
  return String(n).padStart(4, '0')
}

export function saveLead(input: LeadInput): Lead {
  const lead: Lead = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...input }
  const all = read()
  // Evita duplicar si la misma persona se registra dos veces seguidas.
  const key = (l: Lead) => `${l.role}|${l.email || l.phone}`
  const filtered = all.filter((l) => key(l) !== key(lead))
  localStorage.setItem(KEY, JSON.stringify([...filtered, lead]))
  return lead
}

export function clearLeads() {
  localStorage.removeItem(KEY)
}

function csvCell(v: string) {
  // Evita inyección de fórmulas al abrir en Excel.
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v
  return `"${safe.replace(/"/g, '""')}"`
}

export function leadsToCsv(leads: Lead[]): string {
  const head = ['Fecha', 'Nombre', 'Correo', 'WhatsApp', 'Contacto preferido', 'Tipo', 'Necesidad']
  const rows = leads.map((l) => [new Date(l.createdAt).toLocaleString('es-HN'), l.name, l.email ?? '', l.phone, l.via ?? 'whatsapp', l.role, l.need].map(csvCell).join(','))
  return [head.join(','), ...rows].join('\n')
}
