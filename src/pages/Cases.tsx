import { CaretRight, ChatCircleText, FolderOpen, Signpost } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLawyer } from '../data/mock'
import { Avatar, DocList, EmptyState, Folder, PageHead, Timeline, categoryName } from '../components/ui'
import { useApp } from '../lib/app'
import { CaseRoute, Stamp } from '../components/visual'
import { formatShort, relativeShort } from '../lib/dates'

export function CaseList() {
  const { db } = useApp()
  return (
    <div className="page narrow">
      <PageHead title="Mis casos" sub="Cada avance que registra su abogado aparece aquí." />
      {db.cases.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Aún no tiene casos" text="Después de su primera consulta, su abogado abre el expediente y usted lo sigue desde aquí.">
          <Link to="/buscar" className="btn btn-primary">Buscar abogado</Link>
        </EmptyState>
      ) : (
        <ul className="result-list stagger">
          {db.cases.map((c) => (
            <li key={c.id}>
              <Link to={`/casos/${c.id}`} className="case-card">
                <span className="folder-tab">Expediente {c.id}</span>
                <div className="case-card-paper">
                  <div className="case-card-head">
                    <div><b>{c.title}</b><small className="muted">Lleva su caso {getLawyer(c.lawyerId)?.name}</small></div>
                    <CaretRight className="muted" weight="bold" size={18} />
                  </div>
                  <CaseRoute status={c.status} />
                  {c.updates[0] && <p className="case-card-last"><b>{c.updates[0].title}</b> <span className="muted">{relativeShort(c.updates[0].at.slice(0, 10)).toLowerCase()}</span></p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const tabs = ['Avances', 'Documentos', 'Datos del caso'] as const

export function CaseDetail() {
  const { id = '' } = useParams()
  const { db } = useApp()
  const c = db.cases.find((x) => x.id === id)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Avances')
  if (!c) return <EmptyState icon={FolderOpen} title="No encontramos ese caso" text="Revise la lista de sus casos."><Link to="/casos" className="btn btn-primary">Ver mis casos</Link></EmptyState>
  const lawyer = getLawyer(c.lawyerId)
  const docs = db.docs.filter((d) => d.caseId === c.id)

  return (
    <div className="page narrow">
      <Folder tab={`Expediente ${c.id}`}>
        <div className="folder-head">
          <div><h1>{c.title}</h1><p className="muted">{categoryName(c.area)}</p></div>
          <Stamp status={c.status} />
        </div>
        <CaseRoute status={c.status} />
        <div className="next-step"><Signpost size={24} weight="fill" /><div><small>Lo que sigue</small><b>{c.nextStep}</b></div></div>
        {lawyer && (
          <div className="folder-person">
            <Avatar name={lawyer.name} photo={lawyer.photo} size={44} verified />
            <span><small className="muted">Lleva su caso</small><b>{lawyer.name}</b></span>
            <Link to={`/mensajes?con=${lawyer.id}`} className="btn btn-outline"><ChatCircleText size={18} weight="fill" /> Escribirle</Link>
          </div>
        )}
      </Folder>

      <div className="tabs" role="tablist">
        {tabs.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}{t === 'Documentos' && ` (${docs.length})`}</button>)}
      </div>

      {tab === 'Avances' && <Timeline updates={c.updates} />}
      {tab === 'Documentos' && <DocList docs={docs} caseId={c.id} />}
      {tab === 'Datos del caso' && (
        <section className="panel">
          <dl className="summary">
            <dt>Expediente</dt><dd>{c.id}</dd>
            <dt>Tema</dt><dd>{categoryName(c.area)}</dd>
            <dt>Abierto el</dt><dd>{formatShort(c.openedAt)}</dd>
            <dt>Abogado</dt><dd>{lawyer?.name} · Colegiación N.º {lawyer?.bar}</dd>
            <dt>Consultas</dt><dd>{db.consultations.filter((x) => x.caseId === c.id).length}</dd>
          </dl>
        </section>
      )}
    </div>
  )
}
