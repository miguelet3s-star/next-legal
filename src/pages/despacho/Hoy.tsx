import { CalendarCheck, CaretRight, FolderOpen, MapPin, Money, Signpost, UserPlus, VideoCamera } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getLawyer } from '../../data/mock'
import { CaseRoute, CountMoney, DayArc, Guilloche, WeekBars } from '../../components/visual'
import { effectiveSettings } from '../../lib/lawyers'
import { useApp } from '../../lib/app'
import { lawyerIncome, weeklyIncome } from '../../lib/db'
import { daysBetween, formatLong, formatTime, monthName, today } from '../../lib/dates'
import { formatLempiras } from '../../lib/money'
import { ConsultRow } from './ConsultRow'
import { DayRail } from './DayRail'

function greeting(hour: number) {
  return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export default function Hoy() {
  const { me, db } = useApp()
  const ref = today()
  const [now] = useState(() => { const d = new Date(); return { hour: d.getHours(), hhmm: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` } })
  const lawyer = getLawyer(me.userId)!
  const hours = effectiveSettings(db, lawyer)
  const lastName = lawyer.name.split(' ').slice(-1)[0] ?? ''
  const todays = db.consultations.filter((c) => c.date === ref && (c.status === 'confirmada' || c.status === 'realizada')).sort((a, b) => a.time.localeCompare(b.time))
  const upNext = db.consultations.filter((c) => c.status === 'confirmada' && (c.date > ref || (c.date === ref && c.time >= now.hhmm))).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
  const upClient = upNext && db.clients.find((x) => x.id === upNext.clientId)
  const requests = db.consultations.filter((c) => c.status === 'por-confirmar').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const income = lawyerIncome(db.consultations, ref.slice(0, 7))
  const open = db.cases.filter((c) => c.status !== 'Cerrado')
  const waiting = open.map((c) => ({ c, days: daysBetween(c.updates[0]?.at.slice(0, 10) ?? c.openedAt, ref) })).sort((a, b) => b.days - a.days)

  return (
    <div className="page">
      <section className="hero-band desk-band">
        <Guilloche />
        <div className="hero-copy">
          <p className="hero-hi">{formatLong(ref)}</p>
          <h1>{greeting(now.hour)}, Abg. {lastName}</h1>
          {upNext && upClient ? (
            <Link to={upNext.caseId ? `/despacho/casos/${upNext.caseId}` : '/despacho/agenda'} className="up-next">
              <span className="up-next-time"><small>{upNext.date === ref ? 'Sigue hoy' : 'Su próxima consulta'}</small><b>{formatTime(upNext.time)}</b></span>
              <span className="up-next-who"><b>{upClient.name}</b><small>{upNext.mode === 'En línea' ? <VideoCamera size={15} weight="fill" /> : <MapPin size={15} weight="fill" />} {upNext.mode}{upNext.date !== ref && `, ${formatLong(upNext.date)}`}</small></span>
              <CaretRight weight="bold" size={20} />
            </Link>
          ) : <p className="hero-sub">No tiene consultas pendientes en su agenda.</p>}
        </div>
        <DayArc from={hours.from} to={hours.to} now={now.hhmm} marks={todays.map((c) => ({ time: c.time, done: c.status === 'realizada' }))} label={todays.length === 1 ? 'consulta hoy' : 'consultas hoy'} />
        <div className="figures">
          <Link to="/despacho/agenda" className={requests.length ? 'alert' : ''}><span className="round-ic"><UserPlus size={22} weight="fill" /></span><b>{requests.length}</b><small>{requests.length === 1 ? 'solicitud nueva' : 'solicitudes nuevas'}</small></Link>
          <Link to="/despacho/casos"><span className="round-ic"><FolderOpen size={22} weight="fill" /></span><b>{open.length}</b><small>{open.length === 1 ? 'expediente abierto' : 'expedientes abiertos'}</small></Link>
          <Link to="/despacho/ingresos"><span className="round-ic"><Money size={22} weight="fill" /></span><b>{formatLempiras(income.earned).replace('.00', '')}</b><small>ganado en {monthName(ref)}</small></Link>
        </div>
      </section>

      <div className="desk">
        <div className="desk-main">
          <section className="panel">
            <div className="section-head"><h2>Su día</h2><Link to="/despacho/agenda">Ver agenda <CaretRight size={14} weight="bold" /></Link></div>
            <DayRail date={ref} />
          </section>
        </div>

        <aside className="desk-side">
          <section className="panel">
            <h2 className="list-title">Solicitudes nuevas {requests.length > 0 && <span className="count">{requests.length}</span>}</h2>
            {requests.length === 0 ? <p className="muted with-ic"><CalendarCheck size={20} /> Ya respondió todas las solicitudes.</p> : <ul className="consult-list compact">{requests.map((c) => <li key={c.id}><ConsultRow c={c} /></li>)}</ul>}
          </section>

          <section className="panel">
            <div className="section-head"><h2>Esperan un avance</h2><Link to="/despacho/casos">Ver todos <CaretRight size={14} weight="bold" /></Link></div>
            {waiting.length === 0 ? <p className="muted">No tiene expedientes abiertos.</p> : (
              <ul className="case-list">
                {waiting.map(({ c, days }) => (
                  <li key={c.id}>
                    <Link to={`/despacho/casos/${c.id}`} className="case-item wait">
                      <span className={`wait-days ${days >= 14 ? 'late' : ''}`}><b>{days}</b><small>{days === 1 ? 'día' : 'días'}</small></span>
                      <div>
                        <b>{c.title}</b>
                        <small className="muted">{db.clients.find((x) => x.id === c.clientId)?.name}</small>
                        <CaseRoute status={c.status} compact />
                        <small className="with-ic next-inline"><Signpost size={15} weight="fill" /> {c.nextStep}</small>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="muted small">Días desde el último avance que usted registró.</p>
          </section>

          <section className="panel">
            <div className="section-head"><h2>Ingresos de {monthName(ref)}</h2><Link to="/despacho/ingresos">Detalle</Link></div>
            <CountMoney cents={income.earned} />
            <p className="muted small">Más {formatLempiras(income.upcoming)} por consultas confirmadas</p>
            <WeekBars weeks={weeklyIncome(db.consultations, ref, 6)} />
          </section>
        </aside>
      </div>
    </div>
  )
}
