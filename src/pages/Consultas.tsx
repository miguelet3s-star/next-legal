import { CalendarBlank, CalendarPlus, ChatCircleText, Clock, MapPin, VideoCamera } from '@phosphor-icons/react'
import { downloadIcs } from '../lib/ics'
import { toast } from '../lib/toast'
import { Link } from 'react-router-dom'
import { getLawyer } from '../data/mock'
import { Avatar, ConsultChip, DateBlock, EmptyState, PageHead } from '../components/ui'
import { newId, useApp } from '../lib/app'
import type { Consultation } from '../lib/db'
import { cancelConsultation } from '../lib/db'
import { formatTime, relativeDay, today, untilLabel } from '../lib/dates'
import { formatLempiras } from '../lib/money'
import { update } from '../lib/store'

export default function Consultas() {
  const { db } = useApp()
  const ref = today()
  const sorted = [...db.consultations].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const isUpcoming = (c: Consultation) => c.date >= ref && (c.status === 'confirmada' || c.status === 'por-confirmar')
  const upcoming = sorted.filter(isUpcoming)
  const past = sorted.filter((c) => !isUpcoming(c)).reverse()

  const cancel = (c: Consultation) => {
    if (confirm(`¿Cancelar la consulta del ${relativeDay(c.date, ref).toLowerCase()}? Se le devuelve ${formatLempiras(c.price + c.fee)}.`)) { update((d) => cancelConsultation(d, c.id, newId(), today())); toast('Consulta cancelada. Su pago fue devuelto.') }
  }

  const card = (c: Consultation) => {
    const lawyer = getLawyer(c.lawyerId)
    return (
      <li key={c.id} className="consult">
        <DateBlock date={c.date} />
        <div className="consult-body">
          <div className="row"><b>{relativeDay(c.date, ref)}</b><span className="chips">{isUpcoming(c) && <span className="until">{untilLabel(c.date, ref)}</span>}<ConsultChip status={c.status} /></span></div>
          <p className="meta"><Clock size={18} /> {formatTime(c.time)}, 60 minutos</p>
          <p className="meta">{c.mode === 'En línea' ? <><VideoCamera size={18} /> Por videollamada</> : <><MapPin size={18} /> En la oficina, {lawyer?.city}</>}</p>
          {lawyer && <div className="with-person"><Avatar name={lawyer.name} photo={lawyer.photo} size={36} /><span><b>{lawyer.name}</b><small className="muted">{formatLempiras(c.price + c.fee)} pagados</small></span></div>}
          {c.status === 'confirmada' && c.mode === 'En línea' && c.date >= ref && <p className="muted small">El enlace de la videollamada le llega por mensaje 10 minutos antes.</p>}
          {isUpcoming(c) && (
            <div className="consult-actions">
              <Link to={`/mensajes?con=${c.lawyerId}`} className="btn btn-outline"><ChatCircleText size={18} weight="fill" /> Escribirle</Link>
              {lawyer && <button className="btn btn-outline" onClick={() => downloadIcs(c, lawyer.name, c.mode === 'En línea' ? 'Videollamada de Next Legal' : `Oficina en ${lawyer.city}`)}><CalendarPlus size={18} weight="fill" /> A mi calendario</button>}
              <button className="btn btn-quiet" onClick={() => cancel(c)}>Cancelar consulta</button>
            </div>
          )}
        </div>
      </li>
    )
  }

  return (
    <div className="page narrow">
      <PageHead title="Consultas"><Link to="/buscar" className="btn btn-primary"><CalendarPlus size={20} weight="fill" /> Agendar consulta</Link></PageHead>
      {db.consultations.length === 0 && <EmptyState icon={CalendarBlank} title="Aún no tiene consultas" text="Elija un abogado y agende su primera consulta." />}
      {upcoming.length > 0 && <><h2 className="list-title">Próximas</h2><ul className="consult-list upcoming stagger">{upcoming.map(card)}</ul></>}
      {past.length > 0 && <><h2 className="list-title">Anteriores</h2><ul className="consult-list past">{past.map(card)}</ul></>}
    </div>
  )
}
