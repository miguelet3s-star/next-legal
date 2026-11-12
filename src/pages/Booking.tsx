import { Briefcase, CalendarBlank, CheckCircle, ClipboardText, CreditCard, LockSimple, Plus, UserCircle, VideoCamera } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PLATFORM_FEE_BPS, getLawyer } from '../data/mock'
import { EmptyState, categoryName } from '../components/ui'
import { bookingTotal, formatLempiras } from '../lib/money'

const steps = [
  { label: 'Servicio', icon: Briefcase },
  { label: 'Fecha y hora', icon: CalendarBlank },
  { label: 'Resumen', icon: ClipboardText },
  { label: 'Pago', icon: CreditCard },
]
const slots = ['08:00 a.m.', '10:00 a.m.', '11:30 a.m.', '02:00 p.m.', '04:00 p.m.']
const days = ['Lun 26 may', 'Mar 27 may', 'Mié 28 may', 'Jue 29 may', 'Vie 30 may']

export default function Booking() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const lawyer = getLawyer(id)
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<string>('En línea')
  const [day, setDay] = useState(days[1])
  const [slot, setSlot] = useState(slots[1])
  const [card, setCard] = useState('4242')
  const [paid, setPaid] = useState(false)

  if (!lawyer) return <EmptyState title="Abogado no encontrado" text="Vuelve a la búsqueda." />
  const { consultation, fee, total } = bookingTotal(lawyer.consultationPrice, PLATFORM_FEE_BPS)

  if (paid) {
    return (
      <div className="page narrow center">
        <CheckCircle size={64} className="success" />
        <h1>¡Consulta agendada!</h1>
        <p className="muted">{day} · {slot} con {lawyer.name}. Pago simulado: no se cobró nada.</p>
        <button className="btn btn-primary" onClick={() => navigate('/inicio')}>Volver al inicio</button>
      </div>
    )
  }

  return (
    <div className="page narrow">
      <h1 className="page-title">Agendar consulta</h1>
      <ol className="stepper">
        {steps.map((s, i) => (
          <li key={s.label} className={i <= step ? 'done' : ''}>
            <button onClick={() => setStep(i)} aria-label={s.label}>{i === step ? i + 1 : <s.icon size={16} />}</button>
            <small>{s.label}</small>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="panel">
          <h2>Modalidad</h2>
          <div className="option-list">
            {lawyer.modes.map((m) => (
              <label key={m} className={`option ${mode === m ? 'selected' : ''}`}>
                <input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} /> {m}
              </label>
            ))}
          </div>
          <button className="btn btn-primary btn-block" onClick={() => setStep(1)}>Continuar</button>
        </section>
      )}

      {step === 1 && (
        <section className="panel">
          <h2>Elige día</h2>
          <div className="pill-row">{days.map((d) => <button key={d} className={`pill ${d === day ? 'active' : ''}`} onClick={() => setDay(d)}>{d}</button>)}</div>
          <h2>Elige hora</h2>
          <div className="pill-row">{slots.map((s) => <button key={s} className={`pill ${s === slot ? 'active' : ''}`} onClick={() => setSlot(s)}>{s}</button>)}</div>
          <button className="btn btn-primary btn-block" onClick={() => setStep(2)}>Continuar</button>
        </section>
      )}

      {step >= 2 && (
        <>
          <section className="panel">
            <h2>Resumen de tu consulta</h2>
            <dl className="summary">
              <dt><UserCircle size={16} /> Abogada</dt><dd>{lawyer.name}</dd>
              <dt><Briefcase size={16} /> Especialidad</dt><dd>{categoryName(lawyer.category)}</dd>
              <dt><CalendarBlank size={16} /> Fecha y hora</dt><dd>{day} · {slot}</dd>
              <dt><VideoCamera size={16} /> Modalidad</dt><dd>{mode}</dd>
            </dl>
          </section>
          <section className="panel">
            <h2>Resumen de pago</h2>
            <div className="row"><span>Consulta (60 min)</span><span>{formatLempiras(consultation)}</span></div>
            <div className="row"><span>Comisión de plataforma</span><span>{formatLempiras(fee)}</span></div>
            <div className="row total"><span>Total</span><span>{formatLempiras(total)}</span></div>
          </section>
          {step === 3 && (
            <section className="panel">
              <h2>Método de pago</h2>
              <div className="option-list">
                <label className={`option ${card === '4242' ? 'selected' : ''}`}>
                  <input type="radio" name="card" checked={card === '4242'} onChange={() => setCard('4242')} />
                  <span className="visa">VISA</span> •••• 4242
                </label>
                <label className={`option ${card === 'new' ? 'selected' : ''}`}>
                  <input type="radio" name="card" checked={card === 'new'} onChange={() => setCard('new')} />
                  <Plus size={18} /> Agregar nueva tarjeta
                </label>
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={() => setPaid(true)}>Pagar consulta</button>
              <p className="muted small center"><LockSimple size={14} /> Pago seguro y encriptado</p>
            </section>
          )}
          {step === 2 && <button className="btn btn-primary btn-block" onClick={() => setStep(3)}>Ir a pagar</button>}
        </>
      )}
    </div>
  )
}
