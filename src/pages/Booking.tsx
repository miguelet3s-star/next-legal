import { Briefcase, CalendarBlank, ClipboardText, CreditCard, LockSimple, UserCircle, VideoCamera } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getLawyer } from '../data/mock'
import { Avatar, EmptyState, PageHead, categoryName } from '../components/ui'
import { newId, useApp } from '../lib/app'
import type { Mode } from '../lib/db'
import { PLATFORM_FEE_BPS, bookConsultation, freeSlots, openDays } from '../lib/db'
import { dayNumber, formatLong, formatTime, monthShort, today, weekday } from '../lib/dates'
import { effectiveSettings } from '../lib/lawyers'
import { bookingTotal, formatLempiras } from '../lib/money'
import { getDb, update } from '../lib/store'
import { asset } from '../lib/asset'

const steps = [
  { label: 'Su caso', icon: Briefcase },
  { label: 'Fecha y hora', icon: CalendarBlank },
  { label: 'Resumen', icon: ClipboardText },
  { label: 'Pago', icon: CreditCard },
]
const CARD = 'Visa terminada en 4242'

export default function Booking() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { me, db } = useApp()
  const lawyer = getLawyer(id)
  const [params] = useSearchParams()
  const preDay = params.get('dia'), preSlot = params.get('hora')
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<Mode | null>(null)
  const [topic, setTopic] = useState('')
  const [day, setDay] = useState<string | null>(preDay)
  const [slot, setSlot] = useState<string | null>(preSlot)
  const [error, setError] = useState('')
  const [paid, setPaid] = useState(false)
  // Un solo identificador por intento: tocar "Pagar" dos veces no cobra dos veces.
  const [ids] = useState(() => ({ id: newId(), paymentId: newId() }))

  if (!lawyer) return <EmptyState title="No encontramos ese abogado" text="Vuelva a la búsqueda y elija otro."><Link to="/buscar" className="btn btn-primary">Buscar abogado</Link></EmptyState>
  const s = effectiveSettings(db, lawyer)
  const ref = today()
  const days = openDays(s, ref)
  const theDay = day && days.includes(day) ? day : days[0]
  // Las horas libres se calculan con la agenda completa del abogado, no solo con las consultas propias.
  const slots = theDay ? freeSlots(getDb(), lawyer.id, s, theDay) : []
  const theMode = mode ?? s.modes[0]
  const theSlot = slot && slots.includes(slot) ? slot : null
  const morning = slots.filter((x) => x < '12:00'), afternoon = slots.filter((x) => x >= '12:00')
  const { consultation, fee, total } = bookingTotal(s.price, PLATFORM_FEE_BPS)

  if (!s.acceptsNew || days.length === 0) {
    return <EmptyState icon={CalendarBlank} title="Agenda llena por ahora" text={`${lawyer.name} no tiene horas disponibles. Puede elegir otro abogado del mismo tema.`}><Link to={`/buscar?cat=${lawyer.category}`} className="btn btn-primary">Ver otros abogados</Link></EmptyState>
  }

  const pay = () => {
    if (!theSlot) return
    try {
      update((d) => bookConsultation(d, { ...ids, clientId: me.userId, lawyerId: lawyer.id, date: theDay, time: theSlot, mode: theMode, topic, price: s.price, method: CARD, today: ref }))
      setPaid(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agendar. Intente de nuevo.')
      setSlot(null)
      setStep(1)
    }
  }

  if (paid && slot) {
    return (
      <div className="page narrow center done">
        <img src={asset('/img/sello.svg')} alt="" className="seal-stamp" />
        <h1>Consulta agendada</h1>
        <p className="muted">El {formatLong(theDay)} a las {formatTime(slot)} con {lawyer.name}. Le avisaremos cuando confirme.</p>
        <div className="done-actions">
          <button className="btn btn-primary" onClick={() => navigate('/consultas')}>Ver mis consultas</button>
          <button className="btn btn-outline" onClick={() => navigate(`/mensajes?con=${lawyer.id}`)}>Escribirle a {lawyer.name.split(' ')[0]}</button>
        </div>
      </div>
    )
  }

  const canGo = (i: number) => i <= step || i === 1 || !!theSlot

  return (
    <div className="page booking">
      <div className="booking-main">
      <PageHead title="Agendar consulta" sub={`Con ${lawyer.name}, ${categoryName(lawyer.category)}`} />
      <ol className="stepper">
        {steps.map((st, i) => (
          <li key={st.label} className={i <= step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
            <button onClick={() => canGo(i) && setStep(i)} disabled={!canGo(i)} aria-label={`Paso ${i + 1}: ${st.label}`}>{i === step ? i + 1 : <st.icon size={16} weight="fill" />}</button>
            <small>{st.label}</small>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="panel">
          <h2>¿Cómo prefiere la consulta?</h2>
          <div className="option-list">
            {s.modes.map((m) => (
              <label key={m} className={`option ${theMode === m ? 'selected' : ''}`}>
                <input type="radio" name="mode" checked={theMode === m} onChange={() => setMode(m)} />
                <span><b>{m}</b><small className="muted">{m === 'En línea' ? 'Por videollamada, desde su celular' : `En la oficina del abogado, en ${lawyer.city}`}</small></span>
              </label>
            ))}
          </div>
          <label className="form-field">
            <span>Cuente su caso en pocas palabras</span>
            <textarea className="field" rows={3} maxLength={400} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Por ejemplo: me despidieron hace un mes y no me han pagado." />
            <small className="muted">Así su abogado llega preparado a la consulta.</small>
          </label>
          <button className="btn btn-primary btn-block" onClick={() => setStep(1)}>Continuar</button>
        </section>
      )}

      {step === 1 && (
        <section className="panel">
          {error && <p className="notice-box warn" role="alert">{error}</p>}
          <h2>Elija el día</h2>
          <div className="pill-row">
            {days.map((d) => (
              <button key={d} className={`pill day-pill ${d === theDay ? 'active' : ''}`} aria-pressed={d === theDay} onClick={() => { setDay(d); setSlot(null) }}>
                <small>{weekday(d).slice(0, 3)}</small><b>{dayNumber(d)}</b><small>{monthShort(d)}</small>
              </button>
            ))}
          </div>
          <h2>Elija la hora</h2>
          {slots.length === 0 ? <p className="muted">Ese día ya no tiene horas libres. Elija otro día.</p> : (
            <>
              {[['Por la mañana', morning], ['Por la tarde', afternoon]].map(([label, list]) => (list as string[]).length > 0 && (
                <div key={label as string} className="slot-group">
                  <small className="muted">{label as string}</small>
                  <div className="pill-row">{(list as string[]).map((x) => <button key={x} className={`pill ${x === slot ? 'active' : ''}`} aria-pressed={x === slot} onClick={() => { setSlot(x); setError('') }}>{formatTime(x)}</button>)}</div>
                </div>
              ))}
            </>
          )}
          <button className="btn btn-primary btn-block" disabled={!theSlot} onClick={() => setStep(2)}>Continuar</button>
        </section>
      )}

      {step >= 2 && theSlot && (
        <>
          <section className="panel">
            <h2>Resumen de su consulta</h2>
            <dl className="summary">
              <dt><UserCircle size={18} /> Abogado</dt><dd>{lawyer.name}</dd>
              <dt><Briefcase size={18} /> Tema</dt><dd>{categoryName(lawyer.category)}</dd>
              <dt><CalendarBlank size={18} /> Fecha y hora</dt><dd>{formatLong(theDay)}, {formatTime(theSlot)}</dd>
              <dt><VideoCamera size={18} /> Atención</dt><dd>{theMode}</dd>
            </dl>
          </section>
          <section className="panel">
            <h2>Lo que va a pagar</h2>
            <div className="row"><span>Consulta de 60 minutos</span><span>{formatLempiras(consultation)}</span></div>
            <div className="row"><span>Servicio de Next Legal</span><span>{formatLempiras(fee)}</span></div>
            <div className="row total"><span>Total</span><span>{formatLempiras(total)}</span></div>
            <p className="muted small">Si la consulta se cancela antes de realizarse, se le devuelve el total.</p>
          </section>
          {step === 2 && <button className="btn btn-primary btn-block btn-lg" onClick={() => setStep(3)}>Ir a pagar</button>}
          {step === 3 && (
            <section className="panel">
              <h2>Forma de pago</h2>
              <div className="option-list">
                <label className="option selected">
                  <input type="radio" name="card" checked readOnly />
                  <span className="visa">VISA</span> <span>terminada en 4242</span>
                </label>
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={pay}>Pagar {formatLempiras(total)}</button>
              <p className="muted small center with-ic"><LockSimple size={14} weight="fill" /> Pago protegido</p>
            </section>
          )}
        </>
      )}
      </div>

      <aside className="ticket" aria-label="Su consulta">
        <div className="ticket-head"><Avatar name={lawyer.name} photo={lawyer.photo} size={52} verified /><span><b>{lawyer.name}</b><small>{categoryName(lawyer.category)}</small></span></div>
        <dl>
          <dt>Atención</dt><dd>{theMode}</dd>
          <dt>Día</dt><dd>{step >= 1 || day ? formatLong(theDay) : 'Por elegir'}</dd>
          <dt>Hora</dt><dd>{theSlot ? formatTime(theSlot) : 'Por elegir'}</dd>
        </dl>
        <div className="ticket-cut" aria-hidden="true" />
        <div className="ticket-total"><span>Total</span><b>{formatLempiras(total)}</b></div>
        <small>Consulta {formatLempiras(consultation)} + servicio {formatLempiras(fee)}</small>
      </aside>
    </div>
  )
}
