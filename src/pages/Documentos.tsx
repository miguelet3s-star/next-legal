import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from '@phosphor-icons/react'
import { DocList, EmptyState, PageHead } from '../components/ui'
import { useApp } from '../lib/app'

export default function Documentos() {
  const { db } = useApp()
  const [caseId, setCaseId] = useState(db.cases[0]?.id ?? '')
  const title = (id: string) => db.cases.find((c) => c.id === id)?.title ?? id

  if (db.cases.length === 0) {
    return (
      <div className="page narrow">
        <PageHead title="Documentos" />
        <EmptyState icon={FileText} title="Aún no tiene documentos" text="Los documentos se guardan dentro de cada caso. Cuando tenga un caso abierto podrá subirlos aquí."><Link to="/buscar" className="btn btn-primary">Buscar abogado</Link></EmptyState>
      </div>
    )
  }

  return (
    <div className="page narrow">
      <PageHead title="Documentos" sub="Todo lo que usted y sus abogados han subido a sus casos." />
      <label className="form-field">
        <span>Subir al caso</span>
        <select className="field" value={caseId} onChange={(e) => setCaseId(e.target.value)}>
          {db.cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </label>
      <DocList docs={db.docs} caseId={caseId} caseLabel={title} />
    </div>
  )
}
