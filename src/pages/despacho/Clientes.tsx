import { ChatCircleText, MapPin, Phone, UsersThree } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Avatar, EmptyState, PageHead } from '../../components/ui'
import { useApp } from '../../lib/app'

export default function Clientes() {
  const { db } = useApp()
  const clients = [...db.clients].sort((a, b) => a.name.localeCompare(b.name, 'es'))

  return (
    <div className="page narrow">
      <PageHead title="Clientes" sub="Las personas que han agendado una consulta con usted." />
      {clients.length === 0 ? <EmptyState icon={UsersThree} title="Aún no tiene clientes" text="Cuando alguien agende una consulta con usted, aparecerá aquí." /> : (
        <ul className="result-list">
          {clients.map((p) => {
            const cases = db.cases.filter((c) => c.clientId === p.id)
            const consults = db.consultations.filter((c) => c.clientId === p.id && c.status !== 'cancelada').length
            return (
              <li key={p.id} className="result client">
                <Avatar name={p.name} size={56} />
                <div className="result-body">
                  <b>{p.name}</b>
                  <small className="muted with-ic"><MapPin size={15} weight="fill" /> {p.city}</small>
                  <small className="muted">{consults === 1 ? '1 consulta' : `${consults} consultas`}{cases.length > 0 && ` · ${cases.map((c) => c.title).join(', ')}`}</small>
                  <div className="consult-actions">
                    <a href={`tel:${p.phone.replace(/[^\d+]/g, '')}`} className="btn btn-quiet"><Phone size={18} weight="fill" /> {p.phone}</a>
                    <Link to={`/despacho/mensajes?con=${p.id}`} className="btn btn-outline"><ChatCircleText size={18} weight="fill" /> Escribirle</Link>
                    {cases[0] && <Link to={`/despacho/casos/${cases[0].id}`} className="btn btn-quiet">Ver expediente</Link>}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
