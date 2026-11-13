import { CaretRight, CheckCircle, Clock, Money, SealCheck, SignOut, UsersThree, VideoCamera } from '@phosphor-icons/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getLawyer } from '../../data/mock'
import { Avatar, PageHead, Stars, Switch, categoryName } from '../../components/ui'
import { useApp } from '../../lib/app'
import type { Mode } from '../../lib/db'
import { saveSettings } from '../../lib/db'
import { formatTime, hourSlots } from '../../lib/dates'
import { daysLabel, effectiveSettings, modesLabel } from '../../lib/lawyers'
import { formatLempiras, parseLempiras } from '../../lib/money'
import { signOut } from '../../lib/session'
import { update } from '../../lib/store'
import { toast } from '../../lib/toast'

const DAYS: [number, string][] = [[1, 'Lun'], [2, 'Mar'], [3, 'Mié'], [4, 'Jue'], [5, 'Vie'], [6, 'Sáb'], [0, 'Dom']]
const MODES: Mode[] = ['En línea', 'Presencial']
const HOURS = hourSlots('06:00', '21:00')

export default function DeskPerfil() {
  const { me, db } = useApp()
  const navigate = useNavigate()
  const lawyer = getLawyer(me.userId)!
  const current = effectiveSettings(db, lawyer)
  const [s, setS] = useState(current)
  const [price, setPrice] = useState((current.price / 100).toLocaleString('en-US'))
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const change = (patch: Partial<typeof s>) => { setS({ ...s, ...patch }); setSaved(false) }
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  const cents = parseLempiras(price)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const problem = !cents || cents < 10_000 ? 'Escriba el precio de su consulta, de L 100 en adelante.'
      : s.modes.length === 0 ? 'Elija al menos una forma de atención.'
      : s.days.length === 0 ? 'Elija al menos un día de atención.'
      : s.from >= s.to ? 'La hora de cierre va después de la hora de inicio.' : ''
    setError(problem)
    if (problem || !cents) return
    update((d) => saveSettings(d, me.userId, { ...s, price: cents }))
    setSaved(true)
    toast('Su perfil se actualizó')
  }

  return (
    <div className="page">
      <PageHead title="Mi perfil" sub="Así lo encuentran y lo eligen sus clientes." />

      <nav className="menu-list show-mobile" aria-label="Más secciones">
        <Link to="/despacho/clientes"><span className="round-ic"><UsersThree size={22} /></span> Clientes <CaretRight weight="bold" size={18} /></Link>
        <Link to="/despacho/ingresos"><span className="round-ic"><Money size={22} /></span> Ingresos <CaretRight weight="bold" size={18} /></Link>
      </nav>

      <div className="desk">
        <form className="desk-main panel" onSubmit={submit} noValidate>
          <Switch label="Recibo clientes nuevos" hint="Si lo apaga, su perfil sigue visible pero no se pueden agendar consultas." checked={s.acceptsNew} onChange={(v) => change({ acceptsNew: v })} />

          <label className="form-field">
            <span>Precio de la consulta de 60 minutos</span>
            <span className="money-input"><span>L</span><input className="field" inputMode="decimal" value={price} onChange={(e) => { setPrice(e.target.value); setSaved(false) }} aria-invalid={!cents} /></span>
            <small className="muted">Usted recibe este importe completo.</small>
          </label>

          <fieldset className="form-field">
            <legend>Cómo atiende</legend>
            <div className="pill-row">{MODES.map((m) => <button type="button" key={m} className={`pill ${s.modes.includes(m) ? 'active' : ''}`} aria-pressed={s.modes.includes(m)} onClick={() => change({ modes: toggle(s.modes, m) })}>{m}</button>)}</div>
          </fieldset>

          <fieldset className="form-field">
            <legend>Días de atención</legend>
            <div className="pill-row">{DAYS.map(([n, label]) => <button type="button" key={n} className={`pill ${s.days.includes(n) ? 'active' : ''}`} aria-pressed={s.days.includes(n)} onClick={() => change({ days: toggle(s.days, n) })}>{label}</button>)}</div>
          </fieldset>

          <div className="form-2">
            <label className="form-field"><span>Atiende desde</span><select className="field" value={s.from} onChange={(e) => change({ from: e.target.value })}>{HOURS.map((h) => <option key={h} value={h}>{formatTime(h)}</option>)}</select></label>
            <label className="form-field"><span>Hasta</span><select className="field" value={s.to} onChange={(e) => change({ to: e.target.value })}>{HOURS.map((h) => <option key={h} value={h}>{formatTime(h)}</option>)}</select></label>
          </div>

          <label className="form-field">
            <span>Preséntese en una o dos frases</span>
            <textarea className="field" rows={3} maxLength={400} value={s.bio} onChange={(e) => change({ bio: e.target.value })} />
          </label>

          {error && <p className="notice-box warn" role="alert">{error}</p>}
          <div className="form-actions">
            <button className="btn btn-primary">Guardar cambios</button>
            {saved && <span className="saved" role="status"><CheckCircle size={20} weight="fill" /> Cambios guardados</span>}
          </div>
        </form>

        <aside className="desk-side">
          <section className="panel preview">
            <small className="muted">Así lo ve un cliente</small>
            <Avatar name={lawyer.name} photo={lawyer.photo} size={88} verified />
            <h2>{lawyer.name}</h2>
            <p className="muted">{categoryName(lawyer.category)}</p>
            <Stars rating={lawyer.rating} reviews={lawyer.reviews} />
            <span className="credential-seal"><SealCheck weight="fill" size={15} /> Colegiación N.º {lawyer.bar}</span>
            <p className="preview-bio">{s.bio}</p>
            <p className="meta"><VideoCamera size={18} /> {modesLabel(s.modes) || 'Sin forma de atención'}</p>
            <p className="meta"><Clock size={18} /> {s.days.length ? `${daysLabel(s.days)}, de ${formatTime(s.from)} a ${formatTime(s.to)}` : 'Sin días de atención'}</p>
            <p className="preview-price"><b>{cents ? formatLempiras(cents) : 'L —'}</b> la consulta</p>
            {!s.acceptsNew && <p className="notice-box">Agenda llena por ahora</p>}
          </section>
          <button className="btn btn-outline btn-block" onClick={() => { signOut(); navigate('/entrar') }}><SignOut size={20} /> Cerrar sesión</button>
        </aside>
      </div>
    </div>
  )
}
