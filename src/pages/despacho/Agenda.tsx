import { CalendarCheck } from '@phosphor-icons/react'
import { useState } from 'react'
import { EmptyState, PageHead } from '../../components/ui'
import { useApp } from '../../lib/app'
import type { Consultation } from '../../lib/db'
import { addDays, dayNumber, formatLong, relativeDay, today, weekday } from '../../lib/dates'
import { ConsultRow } from './ConsultRow'
import { DayRail } from './DayRail'

const byTime = (a: Consultation, b: Consultation) => (a.date + a.time).localeCompare(b.date + b.time)

export default function Agenda() {
  const { db } = useApp()
  const ref = today()
  const [day, setDay] = useState(ref)
  const days = Array.from({ length: 10 }, (_, i) => addDays(ref, i))
  const requests = db.consultations.filter((c) => c.status === 'por-confirmar').sort(byTime)
  const past = db.consultations.filter((c) => c.date < ref && c.status !== 'por-confirmar').sort(byTime).reverse()
  const countOn = (d: string) => db.consultations.filter((c) => c.date === d && (c.status === 'confirmada' || c.status === 'realizada')).length
  const pendingOn = (d: string) => requests.some((c) => c.date === d)
  const rel = relativeDay(day, ref)

  return (
    <div className="page">
      <PageHead title="Agenda" sub="Sus consultas hora por hora y las solicitudes que esperan su respuesta." />
      {db.consultations.length === 0 && <EmptyState icon={CalendarCheck} title="Su agenda está libre" text="Cuando un cliente agende una consulta con usted, aparecerá aquí." />}

      <div className="desk">
        <div className="desk-main">
          <div className="week" role="group" aria-label="Día">
            {days.map((d) => {
              const n = countOn(d)
              return (
                <button key={d} className={d === day ? 'active' : ''} aria-pressed={d === day} onClick={() => setDay(d)}>
                  <small>{d === ref ? 'Hoy' : weekday(d).slice(0, 3)}</small>
                  <b>{dayNumber(d)}</b>
                  <span className="week-dots" aria-label={`${n} consultas`}>{Array.from({ length: Math.min(n, 4) }, (_, i) => <i key={i} />)}{pendingOn(d) && <i className="pending" />}</span>
                </button>
              )
            })}
          </div>
          <section className="panel">
            <h2 className="rail-title">{rel === formatLong(day) ? rel : `${rel}, ${formatLong(day)}`}</h2>
            <DayRail date={day} />
          </section>
        </div>

        <aside className="desk-side">
          <section className="panel">
            <h2 className="list-title">Solicitudes por responder {requests.length > 0 && <span className="count">{requests.length}</span>}</h2>
            {requests.length === 0 ? <p className="muted with-ic"><CalendarCheck size={20} /> Ya respondió todas las solicitudes.</p> : <ul className="consult-list compact">{requests.map((c) => <li key={c.id}><ConsultRow c={c} onAccepted={(x) => { if (days.includes(x.date)) setDay(x.date) }} /></li>)}</ul>}
          </section>
          {past.length > 0 && (
            <section className="panel">
              <h2>Anteriores</h2>
              <ul className="consult-list compact past">{past.slice(0, 6).map((c) => <li key={c.id}><ConsultRow c={c} /></li>)}</ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
