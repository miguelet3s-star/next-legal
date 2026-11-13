import { ChatCircleText, Check, FolderOpen, FolderPlus, MapPin, VideoCamera } from '@phosphor-icons/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categories, getLawyer } from '../../data/mock'
import type { CategoryId } from '../../data/mock'
import { Avatar, ConsultChip } from '../../components/ui'
import { newId, useApp } from '../../lib/app'
import type { Consultation } from '../../lib/db'
import { cancelConsultation, completeConsultation, confirmConsultation, nextCaseId, openCase } from '../../lib/db'
import { formatTime, nowStamp, relativeDay, today } from '../../lib/dates'
import { formatLempiras } from '../../lib/money'
import { getDb, update } from '../../lib/store'
import { toast } from '../../lib/toast'

/** Una consulta vista por el abogado, con las acciones que le corresponden según su estado. */
export function ConsultRow({ c, showDate = true, showTime = true, onAccepted }: { c: Consultation; showDate?: boolean; showTime?: boolean; onAccepted?: (c: Consultation) => void }) {
  const { me, db } = useApp()
  const navigate = useNavigate()
  const [opening, setOpening] = useState(false)
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<CategoryId>(getLawyer(me.userId)?.category ?? 'civil')
  const client = db.clients.find((x) => x.id === c.clientId)
  const ref = today()
  if (!client) return null

  const decline = () => {
    if (confirm(`¿Avisar a ${client.name} que no puede atender esta consulta? Se le devuelve su pago.`)) { update((d) => cancelConsultation(d, c.id, newId(), today())); toast(`Se avisó a ${client.name} y se devolvió su pago`) }
  }
  const open = (e: FormEvent) => {
    e.preventDefault()
    if (title.trim().length < 3) return
    const at = nowStamp()
    const id = nextCaseId(getDb(), Number(at.slice(0, 4)))
    update((d) => openCase(d, me.userId, { consultationId: c.id, title, area, updateId: newId(), at }))
    toast(`Expediente ${id} abierto`)
    navigate(`/despacho/casos/${id}`)
  }

  return (
    <article className={`consult ${c.status === 'cancelada' ? 'is-off' : ''} is-${c.status}`}>
      {showTime && <span className="consult-time"><b>{formatTime(c.time)}</b>{showDate && <small>{relativeDay(c.date, ref)}</small>}</span>}
      <div className="consult-body">
        <div className="row">
          <span className="with-person"><Avatar name={client.name} size={36} /><span><b>{client.name}</b><small className="muted with-ic">{c.mode === 'En línea' ? <VideoCamera size={15} weight="fill" /> : <MapPin size={15} weight="fill" />} {c.mode} · {formatLempiras(c.price)}</small></span></span>
          <ConsultChip status={c.status} />
        </div>
        {c.topic && <p className="consult-topic">{c.topic}</p>}

        {opening ? (
          <form className="inline-form" onSubmit={open}>
            <label className="form-field"><span>Nombre del caso</span><input className="field" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Por ejemplo: Despido sin pago de prestaciones" /></label>
            <label className="form-field"><span>Tema</span><select className="field" value={area} onChange={(e) => setArea(e.target.value as CategoryId)}>{categories.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label>
            <div className="consult-actions">
              <button className="btn btn-primary" disabled={title.trim().length < 3}>Abrir expediente</button>
              <button type="button" className="btn btn-quiet" onClick={() => setOpening(false)}>Ahora no</button>
            </div>
          </form>
        ) : (
          <div className="consult-actions">
            {c.status === 'por-confirmar' && <>
              <button className="btn btn-primary" onClick={() => { update((d) => confirmConsultation(d, c.id)); toast(`Consulta con ${client.name} aceptada`); onAccepted?.(c) }}><Check size={18} weight="bold" /> Aceptar consulta</button>
              <button className="btn btn-quiet" onClick={decline}>No puedo atenderla</button>
            </>}
            {c.status === 'confirmada' && c.date <= ref && <button className="btn btn-primary" onClick={() => { update((d) => completeConsultation(d, c.id)); toast('Consulta marcada como realizada') }}><Check size={18} weight="bold" /> Marcar como realizada</button>}
            {c.caseId && <Link to={`/despacho/casos/${c.caseId}`} className="btn btn-outline"><FolderOpen size={18} weight="fill" /> Ver expediente</Link>}
            {!c.caseId && (c.status === 'confirmada' || c.status === 'realizada') && <button className="btn btn-outline" onClick={() => setOpening(true)}><FolderPlus size={18} weight="fill" /> Abrir expediente</button>}
            {c.status !== 'cancelada' && <Link to={`/despacho/mensajes?con=${c.clientId}`} className="btn btn-quiet"><ChatCircleText size={18} weight="fill" /> Escribirle</Link>}
          </div>
        )}
      </div>
    </article>
  )
}
