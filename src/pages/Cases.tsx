import { CaretRight, CheckCircle, Circle, FileText } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { CaseStatus } from '../data/mock'
import { cases, getLawyer } from '../data/mock'
import { EmptyState } from '../components/ui'

export function StatusChip({ status }: { status: CaseStatus }) {
  const cls = status === 'En progreso' ? 'chip-blue' : status === 'En revisión' ? 'chip-soft' : 'chip-amber'
  return <span className={`chip ${cls}`}>{status}</span>
}

export function CaseList() {
  return (
    <div className="page narrow">
      <h1 className="page-title">Mis casos</h1>
      <ul className="result-list">
        {cases.map((c) => (
          <li key={c.id}>
            <Link to={`/casos/${c.id}`} className="result">
              <span className="case-icon"><FileText size={22} /></span>
              <div className="result-body">
                <b>{c.title}</b>
                <small className="muted">Caso #{c.id} · {getLawyer(c.lawyerId)?.name}</small>
                <StatusChip status={c.status} />
              </div>
              <CaretRight className="muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

const tabs = ['Resumen', 'Línea de tiempo', 'Documentos', 'Chat'] as const

export function CaseDetail() {
  const { id = '' } = useParams()
  const c = cases.find((x) => x.id === id)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Línea de tiempo')
  if (!c) return <EmptyState title="Caso no encontrado" text="Revisa el número de caso." />
  const lawyer = getLawyer(c.lawyerId)

  return (
    <div className="page narrow">
      <h1 className="page-title">Seguimiento de mi caso</h1>
      <section className="panel">
        <div className="row"><b>Caso #{c.id}</b><StatusChip status={c.status} /></div>
        <p>{c.title}</p>
        <small className="muted">Abogado(a): {lawyer?.name}</small>
      </section>

      <div className="tabs" role="tablist">
        {tabs.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === 'Línea de tiempo' ? (
        <ol className="timeline">
          {c.timeline.map((e) => (
            <li key={e.title + e.date} className={e.current ? 'current' : ''}>
              <span className="tl-date">{e.current ? <b>Hoy<br /></b> : null}{e.date}</span>
              <span className="tl-dot">{e.current ? <Circle size={18} weight="fill" /> : <CheckCircle size={18} />}</span>
              <div className="tl-body"><b>{e.title}</b><p>{e.detail}</p>{e.time && <small className="muted">{e.time}</small>}</div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title={tab} text="Esta sección se construirá en la siguiente iteración." />
      )}

      <div className="stack">
        <button className="btn btn-primary btn-block">Ver todos los documentos</button>
        <button className="btn btn-outline btn-block">Ir al chat del caso</button>
      </div>
    </div>
  )
}
