import { Clock, MapPin } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import type { Lawyer } from '../data/mock'
import { useApp } from '../lib/app'
import { nextFreeSlot } from '../lib/db'
import { formatTime, relativeDay, today } from '../lib/dates'
import { effectiveSettings } from '../lib/lawyers'
import { formatLempiras } from '../lib/money'
import { getDb } from '../lib/store'
import { Stars, categoryName } from './ui'
import { LawyerArch } from './visual'

/** Ficha de abogado con retrato, próxima hora libre y precio. */
export function LawyerTile({ lawyer }: { lawyer: Lawyer }) {
  const { db } = useApp()
  const s = effectiveSettings(db, lawyer)
  const ref = today()
  const free = s.acceptsNew ? nextFreeSlot(getDb(), lawyer.id, s, ref) : null
  return (
    <article className="lawyer-tile">
      <Link to={`/abogado/${lawyer.id}`} className="lawyer-tile-top" aria-label={`Ver el perfil de ${lawyer.name}`}>
        <LawyerArch lawyer={lawyer} />
        <span className="tile-rating"><Stars rating={lawyer.rating} reviews={lawyer.reviews} /></span>
      </Link>
      <div className="lawyer-tile-body">
        <h3><Link to={`/abogado/${lawyer.id}`}>{lawyer.name}</Link></h3>
        <p className="muted small">{categoryName(lawyer.category)}</p>
        <p className="muted small with-ic"><MapPin size={15} weight="fill" /> {lawyer.city}</p>
        {free && <p className="free-slot"><Clock size={16} weight="fill" /> Libre {relativeDay(free.date, ref).toLowerCase()}, {formatTime(free.time)}</p>}
        <div className="lawyer-tile-foot">
          <span><b>{formatLempiras(s.price)}</b><small className="muted">la consulta</small></span>
          {free ? <Link to={`/agendar/${lawyer.id}`} className="btn btn-primary">Agendar</Link> : <Link to={`/abogado/${lawyer.id}`} className="btn btn-outline">Ver perfil</Link>}
        </div>
      </div>
    </article>
  )
}

