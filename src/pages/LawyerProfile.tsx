import { ArrowLeft, MapPin, Star, VideoCamera } from '@phosphor-icons/react'
import { useNavigate, useParams } from 'react-router-dom'
import { getLawyer } from '../data/mock'
import { Avatar, EmptyState, categoryName } from '../components/ui'
import { formatLempiras } from '../lib/money'

export default function LawyerProfile() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const lawyer = getLawyer(id)
  if (!lawyer) return <EmptyState title="Abogado no encontrado" text="Puede que el perfil ya no esté disponible." />

  return (
    <div className="page narrow profile">
      <div className="profile-head">
        <button className="icon-btn light back" onClick={() => navigate(-1)} aria-label="Volver"><ArrowLeft /></button>
        <Avatar name={lawyer.name} photo={lawyer.photo} size={120} verified />
        <h1>{lawyer.name}</h1>
        <p>{categoryName(lawyer.category)}</p>
        <p><Star weight="fill" className="star" /> <b>{lawyer.rating.toFixed(1)}</b> ({lawyer.reviews} reseñas)</p>
        <div className="stats">
          <div><b>{lawyer.years} años</b><small>Experiencia</small></div>
          <div><b>{lawyer.casesSolved}</b><small>Casos resueltos</small></div>
          <div><b>{lawyer.successRate}%</b><small>Éxito</small></div>
        </div>
      </div>

      <div className="profile-body">
        <h2>Especialidades</h2>
        <div className="tags">{lawyer.specialties.map((s) => <span key={s} className="tag">{s}</span>)}</div>
        <h2>Sobre mí</h2>
        <p>{lawyer.bio}</p>
        <p className="meta"><MapPin size={18} /> {lawyer.city}</p>
        <p className="meta"><VideoCamera size={18} /> Atención {lawyer.modes.join(' y ').toLowerCase()}</p>
        <p className="meta"><b>Consulta (60 min):</b>&nbsp;{formatLempiras(lawyer.consultationPrice)}</p>
        <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate(`/agendar/${lawyer.id}`)}>Agendar consulta</button>
      </div>
    </div>
  )
}
