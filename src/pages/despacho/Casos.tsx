import { CaretRight, ChatCircleText, CheckCircle, FolderOpen, Phone, Signpost } from '@phosphor-icons/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar, DocList, EmptyState, Folder, PageHead, Timeline, categoryName } from '../../components/ui'
import { newId, useApp } from '../../lib/app'
import type { CaseStatus } from '../../lib/db'
import { CASE_STATUSES, addCaseUpdate } from '../../lib/db'
import { CaseRoute, Stamp } from '../../components/visual'
import { daysBetween, formatShort, nowStamp, relativeShort, today } from '../../lib/dates'
import { toast } from '../../lib/toast'
import { update } from '../../lib/store'

export function DeskCaseList() {
  const { db } = useApp()
  const [closed, setClosed] = useState(false)
  const list = db.cases.filter((c) => (c.status === 'Cerrado') === closed)

  return (
    <div className="page narrow">
      <PageHead title="Expedientes" sub="Los casos que usted lleva. Sus clientes ven cada avance que registra." />
      <div className="segmented" role="group" aria-label="Estado">
        <button aria-pressed={!closed} className={closed ? '' : 'active'} onClick={() => setClosed(false)}>Abiertos</button>
        <button aria-pressed={closed} className={closed ? 'active' : ''} onClick={() => setClosed(true)}>Cerrados</button>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={FolderOpen} title={closed ? 'Aún no ha cerrado expedientes' : 'No tiene expedientes abiertos'} text={closed ? 'Los casos que termine quedan guardados aquí.' : 'Abra un expediente desde una consulta confirmada, en su agenda.'}>
          {!closed && <Link to="/despacho/agenda" className="btn btn-primary">Ir a la agenda</Link>}
        </EmptyState>
      ) : (
        <ul className="result-list stagger">
          {list.map((c) => (
            <li key={c.id}>
              <Link to={`/despacho/casos/${c.id}`} className="case-card">
                <span className="folder-tab">Expediente {c.id}</span>
                <div className="case-card-paper">
                  <div className="case-card-head">
                    <Avatar name={db.clients.find((x) => x.id === c.clientId)?.name ?? ''} size={44} />
                    <div><b>{c.title}</b><small className="muted">{db.clients.find((x) => x.id === c.clientId)?.name}</small></div>
                    <CaretRight className="muted" weight="bold" size={18} />
                  </div>
                  <CaseRoute status={c.status} />
                  <p className="case-card-last">{c.updates[0] ? <><b>{c.updates[0].title}</b> <span className="muted">{relativeShort(c.updates[0].at.slice(0, 10)).toLowerCase()}</span></> : 'Sin avances'}{c.status !== 'Cerrado' && c.updates[0] && daysBetween(c.updates[0].at.slice(0, 10), today()) >= 14 && <span className="chip chip-amber">Espera un avance</span>}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const TEMPLATES = ['Documentos recibidos', 'Demanda presentada', 'Audiencia programada', 'Audiencia realizada', 'Acuerdo alcanzado', 'Sentencia emitida']

const tabs = ['Avances', 'Documentos', 'Datos del caso'] as const

export function DeskCaseDetail() {
  const { id = '' } = useParams()
  const { me, db } = useApp()
  const c = db.cases.find((x) => x.id === id)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Avances')
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [status, setStatus] = useState<CaseStatus | ''>('')
  const [saved, setSaved] = useState(false)
  if (!c) return <EmptyState icon={FolderOpen} title="No encontramos ese expediente" text="Revise la lista de sus expedientes."><Link to="/despacho/casos" className="btn btn-primary">Ver expedientes</Link></EmptyState>
  const client = db.clients.find((x) => x.id === c.clientId)
  const docs = db.docs.filter((d) => d.caseId === c.id)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (title.trim().length < 3) return
    update((d) => addCaseUpdate(d, me.userId, c.id, { id: newId(), at: nowStamp(), title, detail, nextStep, status: status || undefined }))
    setTitle(''); setDetail(''); setNextStep(''); setStatus(''); setSaved(true)
    toast('Avance registrado. Su cliente ya lo puede ver.')
  }

  return (
    <div className="page narrow">
      <Folder tab={`Expediente ${c.id}`}>
        <div className="folder-head">
          <div><h1>{c.title}</h1><p className="muted">{categoryName(c.area)}</p></div>
          <Stamp status={c.status} />
        </div>
        <CaseRoute status={c.status} />
        <div className="next-step"><Signpost size={24} weight="fill" /><div><small>Lo que sigue</small><b>{c.nextStep}</b></div></div>
        {client && (
          <div className="folder-person">
            <Avatar name={client.name} size={44} />
            <span><small className="muted">Cliente</small><b>{client.name}</b></span>
            <a href={`tel:${client.phone.replace(/[^\d+]/g, '')}`} className="btn btn-quiet"><Phone size={18} weight="fill" /> {client.phone}</a>
            <Link to={`/despacho/mensajes?con=${client.id}`} className="btn btn-outline"><ChatCircleText size={18} weight="fill" /> Escribirle</Link>
          </div>
        )}
      </Folder>

      <div className="tabs" role="tablist">
        {tabs.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}{t === 'Documentos' && ` (${docs.length})`}</button>)}
      </div>

      {tab === 'Avances' && (
        <>
          <form className="panel" onSubmit={submit}>
            <h2>Registrar un avance</h2>
            <p className="muted small">Su cliente lo verá en su línea de tiempo. Escríbalo en palabras sencillas.</p>
            <div className="templates" aria-label="Avances frecuentes">
              {TEMPLATES.map((t) => <button type="button" key={t} className={title === t ? 'active' : ''} onClick={() => { setTitle(t); setSaved(false) }}>{t}</button>)}
            </div>
            <label className="form-field"><span>Qué pasó</span><input className="field" value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false) }} maxLength={80} placeholder="Por ejemplo: Audiencia programada" /></label>
            <label className="form-field"><span>Detalle</span><textarea className="field" rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={600} placeholder="Explique el avance y qué significa para su cliente." /></label>
            <div className="form-2">
              <label className="form-field"><span>Lo que sigue (opcional)</span><input className="field" value={nextStep} onChange={(e) => setNextStep(e.target.value)} maxLength={120} placeholder={c.nextStep} /></label>
              <label className="form-field"><span>Estado del caso</span>
                <select className="field" value={status} onChange={(e) => setStatus(e.target.value as CaseStatus | '')}>
                  <option value="">Sin cambio ({c.status})</option>
                  {CASE_STATUSES.filter((x) => x !== c.status).map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" disabled={title.trim().length < 3}>Registrar avance</button>
              {saved && <span className="saved" role="status"><CheckCircle size={20} weight="fill" /> Avance registrado</span>}
            </div>
          </form>
          <Timeline updates={c.updates} />
        </>
      )}
      {tab === 'Documentos' && <DocList docs={docs} caseId={c.id} />}
      {tab === 'Datos del caso' && (
        <section className="panel">
          <dl className="summary">
            <dt>Expediente</dt><dd>{c.id}</dd>
            <dt>Tema</dt><dd>{categoryName(c.area)}</dd>
            <dt>Abierto el</dt><dd>{formatShort(c.openedAt)}</dd>
            <dt>Cliente</dt><dd>{client?.name}</dd>
            <dt>Celular</dt><dd>{client?.phone}</dd>
            <dt>Correo</dt><dd>{client?.email}</dd>
            <dt>Ciudad</dt><dd>{client?.city}</dd>
            <dt>Consultas</dt><dd>{db.consultations.filter((x) => x.caseId === c.id).length}</dd>
          </dl>
        </section>
      )}
    </div>
  )
}
