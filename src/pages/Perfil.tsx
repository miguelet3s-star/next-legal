import { CalendarBlank, CaretRight, CheckCircle, CreditCard, FileText, SignOut } from '@phosphor-icons/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, PageHead, Switch } from '../components/ui'
import { useApp } from '../lib/app'
import { saveClient, savePrefs } from '../lib/db'
import { isEmail, normalizeHnPhone } from '../lib/leads'
import { signOut } from '../lib/session'
import { update } from '../lib/store'
import { toast } from '../lib/toast'

export default function Perfil() {
  const { me, db } = useApp()
  const navigate = useNavigate()
  const client = db.clients.find((c) => c.id === me.userId)!
  const prefs = db.prefs[me.userId] ?? { whatsapp: true, email: true }
  const [form, setForm] = useState({ name: client.name, phone: client.phone, email: client.email, city: client.city })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [saved, setSaved] = useState(false)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => { setForm({ ...form, [k]: e.target.value }); setSaved(false) }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    const name = form.name.trim().replace(/\s+/g, ' ')
    const phone = normalizeHnPhone(form.phone)
    const email = form.email.trim().toLowerCase()
    if (name.length < 3 || name.length > 80) errs.name = 'Escriba su nombre completo'
    if (!phone) errs.phone = 'Escriba un número de 8 dígitos'
    if (!isEmail(email)) errs.email = 'Escriba un correo, por ejemplo nombre@gmail.com'
    setErrors(errs)
    if (Object.keys(errs).length || !phone) return
    update((d) => saveClient(d, { id: client.id, name, phone, email, city: form.city.trim().slice(0, 60) }))
    setForm({ name, phone, email, city: form.city.trim() })
    setSaved(true)
    toast('Sus datos se guardaron')
  }

  const field = (k: keyof typeof form, label: string, props: object = {}) => (
    <label className="form-field">
      <span>{label}</span>
      <input className="field" value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <small className="field-err">{errors[k]}</small>}
    </label>
  )

  return (
    <div className="page narrow">
      <PageHead title="Mi perfil" />
      <section className="panel profile-card">
        <Avatar name={client.name} size={64} />
        <div><b>{client.name}</b><small className="muted">{client.email}</small></div>
      </section>

      <nav className="menu-list show-mobile" aria-label="Más secciones">
        <Link to="/consultas"><span className="round-ic"><CalendarBlank size={22} /></span> Consultas <CaretRight weight="bold" size={18} /></Link>
        <Link to="/documentos"><span className="round-ic"><FileText size={22} /></span> Documentos <CaretRight weight="bold" size={18} /></Link>
        <Link to="/pagos"><span className="round-ic"><CreditCard size={22} /></span> Pagos <CaretRight weight="bold" size={18} /></Link>
      </nav>

      <form className="panel" onSubmit={submit} noValidate>
        <h2>Sus datos</h2>
        {field('name', 'Nombre completo', { autoComplete: 'name' })}
        <div className="form-2">
          {field('phone', 'Celular', { inputMode: 'tel', autoComplete: 'tel' })}
          {field('city', 'Ciudad', { autoComplete: 'address-level2' })}
        </div>
        {field('email', 'Correo electrónico', { type: 'email', inputMode: 'email', autoComplete: 'email' })}
        <div className="form-actions">
          <button className="btn btn-primary">Guardar cambios</button>
          {saved && <span className="saved" role="status"><CheckCircle size={20} weight="fill" /> Cambios guardados</span>}
        </div>
      </form>

      <section className="panel">
        <h2>Cómo le avisamos</h2>
        <Switch label="Por WhatsApp" hint="Avances de su caso y recordatorios de consulta" checked={prefs.whatsapp} onChange={(v) => update((d) => savePrefs(d, me.userId, { ...prefs, whatsapp: v }))} />
        <Switch label="Por correo" hint="Recibos de pago y resúmenes" checked={prefs.email} onChange={(v) => update((d) => savePrefs(d, me.userId, { ...prefs, email: v }))} />
      </section>

      <button className="btn btn-outline btn-block" onClick={() => { signOut(); navigate('/entrar') }}><SignOut size={20} /> Cerrar sesión</button>
    </div>
  )
}
