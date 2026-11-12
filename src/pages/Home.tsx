import { CalendarBlank, CaretRight, Clock, FileText, MapPin, Scales, SealCheck, UserCircle } from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { cases, currentUser, getLawyer, lawyers, nextConsultation } from '../data/mock'
import { CategoryGrid, LawyerCard, Logo } from '../components/ui'
import { StatusChip } from './Cases'
import { asset } from '../lib/asset'

export default function Home() {
  const navigate = useNavigate()
  const recommended = [lawyers[0], lawyers[4], lawyers[5]]
  const nextLawyer = getLawyer(nextConsultation.lawyerId)

  return (
    <div className="home">
      <div className="home-main">
        <div className="home-hero" style={{ backgroundImage: `linear-gradient(100deg, rgba(10,27,68,.96) 30%, rgba(10,27,68,.55)), url(${asset('/img/teguc-skyline.jpg')})` }}>
          <div className="hide-mobile"><Logo size="md" light /></div>
          <p className="home-hi">¡Hola, {currentUser.firstName}!</p>
          <h1>¿Qué servicio legal necesitas?</h1>
          <div className="home-hero-chips"><span><SealCheck weight="fill" size={16} /> Abogados verificados</span><span><MapPin weight="fill" size={16} /> Todo Honduras</span></div>
        </div>

        <div className="section-head show-mobile"><h2>Categorías</h2><Link to="/buscar">Ver todas</Link></div>
        <CategoryGrid />

        <div className="banner show-mobile">
          <SealCheck size={36} />
          <div><b>Abogados verificados</b><p>Profesionales certificados y con experiencia comprobada.</p></div>
        </div>

        <div className="section-head"><h2>Abogados recomendados</h2><Link to="/buscar">Ver todos <CaretRight size={14} /></Link></div>
        <div className="lawyer-row">
          {recommended.map((l) => <LawyerCard key={l.id} lawyer={l} />)}
        </div>
      </div>

      <aside className="home-side">
        <section className="panel">
          <div className="section-head"><h2>Mis casos</h2><Link to="/casos">Ver todos</Link></div>
          <ul className="case-list">
            {cases.map((c, i) => (
              <li key={c.id}>
                <Link to={`/casos/${c.id}`} className="case-item">
                  <span className="case-icon">{i === 1 ? <Scales size={22} /> : <FileText size={22} />}</span>
                  <div>
                    <b>{c.title}</b>
                    <small className="muted">Caso #{c.id}</small>
                    <StatusChip status={c.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2 className="with-icon"><CalendarBlank size={22} className="blue" /> Próxima consulta</h2>
          <p className="meta"><CalendarBlank size={18} /> {nextConsultation.date}</p>
          <p className="meta"><Clock size={18} /> {nextConsultation.time}</p>
          <p className="meta"><UserCircle size={18} /> {nextLawyer?.name}</p>
          <button className="btn btn-primary btn-block" onClick={() => navigate('/consultas')}>Ver detalle de la consulta</button>
        </section>
      </aside>
    </div>
  )
}
