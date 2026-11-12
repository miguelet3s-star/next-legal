import { ArrowRight, House, SignIn, Bank, Briefcase, CalendarCheck, ChartLineUp, ChatCircleText, FolderOpen, CheckCircle, EnvelopeSimple, GlobeHemisphereWest, Scales, Sparkle, UsersThree, VideoCamera, Buildings, FileText, Gavel, HandCoins, HeartBreak, MagnifyingGlass, MapPin, Scroll, SealCheck, Star, UserCheck } from '@phosphor-icons/react'
import type { Icon as PhIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { CategoryId, Lawyer } from '../data/mock'
import { getLawyer } from '../data/mock'
import { formatLempiras } from '../lib/money'
import { Avatar, categoryName } from '../components/ui'
import { BrandLogo } from '../components/BrandLogo'
import { LiveLines } from '../components/LiveLines'
import { NetworkMap } from '../components/NetworkMap'
import type { LeadErrors, LeadRole } from '../lib/leads'
import { LAUNCH_DATE, WAITLIST_BASE, isLaunched, pad2, timeLeft } from '../lib/launch'
import hondurasSvg from '../assets/honduras.svg?raw'
import { formatFolio, listLeads, saveLead, validateLead } from '../lib/leads'
import '../landing.css'
import { asset } from '../lib/asset'

const YEAR = new Date().getFullYear()
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- Sello ---------- */
function Seal({ stamped }: { stamped: boolean }) {
  return <img className={`lx-seal ${stamped ? 'is-stamped' : ''}`} src={asset('/img/sello.svg')} alt="Sello Next Legal" />
}

/* ---------- Expediente de verificación (el momento principal) ---------- */
const featured = ['andrea-castillo', 'roberto-zelaya', 'valeria-paz', 'daniel-rivera'].map((id) => getLawyer(id)).filter((l): l is Lawyer => !!l)

function checksFor(l: Lawyer) {
  return [
    { icon: Bank, label: 'Miembro del Colegio de Abogados', detail: `Inscripción N.º ${l.bar}` },
    { icon: Briefcase, label: `${l.years} años de experiencia`, detail: `${l.specialties[0]} y ${l.specialties[1].toLowerCase()}` },
    { icon: Scroll, label: `${l.casesSolved} casos resueltos`, detail: 'Procesos documentados paso a paso' },
    { icon: Star, label: `Calificación de ${l.rating.toFixed(1)} de 5`, detail: `${l.reviews} clientes la recomiendan` },
  ]
}

/** Retrato y perfil de la portada: recorre los abogados destacados uno por uno. */
function HeroVisual() {
  const still = reduceMotion()
  const [idx, setIdx] = useState(0)
  const [stage, setStage] = useState(still ? 5 : 0) // 0..4 marcas, 5 = sellado
  useEffect(() => {
    if (still) return
    const delay = stage === 0 ? 800 : stage < 4 ? 550 : stage === 4 ? 650 : 3800
    const t = setTimeout(() => {
      if (stage < 5) setStage(stage + 1)
      else { setIdx((i) => (i + 1) % featured.length); setStage(0) }
    }, delay)
    return () => clearTimeout(t)
  }, [stage, still])
  const jump = (i: number) => { setIdx(i); setStage(still ? 5 : 0) }
  const l = featured[idx]
  return (
    <div className="lx-hero-visual">
      <div className="lx-arch">
        <svg className="lx-arch-swoosh" viewBox="0 0 400 120" aria-hidden="true"><path d="M10 110 C 120 10, 290 -5, 395 40 C 290 18, 130 30, 10 110 Z" /></svg>
        {featured.map((f, i) => (
          <img key={f.id} className={`lx-hero-person ${i === idx ? 'on' : ''}`} src={f.portrait} alt={i === idx ? `${f.name}, ${categoryName(f.category)}` : ''} aria-hidden={i !== idx} />
        ))}
      </div>
      <Dossier lawyer={l} stage={stage} />
      <div className="lx-hero-dots" role="tablist" aria-label="Abogados destacados">
        {featured.map((f, i) => <button key={f.id} type="button" role="tab" aria-selected={i === idx} aria-label={f.name} className={i === idx ? 'on' : ''} onClick={() => jump(i)} />)}
      </div>
    </div>
  )
}

function Dossier({ lawyer, stage }: { lawyer: Lawyer; stage: number }) {
  const checks = checksFor(lawyer)
  return (
    <Link to={`/abogado/${lawyer.id}`} className="lx-dossier" aria-label={`Ver el perfil de ${lawyer.name}`}>
      <div className="lx-dossier-tab">Perfil profesional</div>
      <div className="lx-dossier-paper" key={lawyer.id}>
        <header className="lx-dossier-head">
          <Avatar name={lawyer.name} photo={lawyer.photo} size={68} />
          <div>
            <h3>{lawyer.name}</h3>
            <p>{categoryName(lawyer.category)}</p>
            <p className="lx-muted"><MapPin size={14} /> {lawyer.city}</p>
          </div>
        </header>
        <ol className="lx-checks">
          {checks.map((c, i) => (
            <li key={c.label} className={stage > i ? 'is-done' : ''}>
              <span className="lx-check-box"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
              <div>
                <b>{c.label}</b>
                <small>{c.detail}</small>
              </div>
            </li>
          ))}
        </ol>
        <footer className="lx-dossier-foot">
          <div className="lx-dossier-price"><small>Consulta de 1 hora</small><b>{formatLempiras(lawyer.consultationPrice).replace('.00', '')}</b></div>
          <span className="lx-link">Ver perfil</span>
        </footer>
        <Seal stamped={stage >= 5} />
      </div>
    </Link>
  )
}

function ProfilePreview({ l, style }: { l: Lawyer; style?: CSSProperties }) {
  return (
    <div className="lx-profile" style={style}>
      <div className="lx-profile-head">
        <Avatar name={l.name} photo={l.photo} size={88} />
        <div>
          <span className="lx-verified"><SealCheck weight="fill" size={16} /> Verificado</span>
          <h3>{l.name}</h3>
          <p>{categoryName(l.category)}, {l.city}</p>
        </div>
      </div>
      <dl className="lx-profile-stats">
        <div><dt>Experiencia</dt><dd>{l.years} años</dd></div>
        <div><dt>Casos resueltos</dt><dd>{l.casesSolved}</dd></div>
        <div><dt>Calificación</dt><dd>{l.rating.toFixed(1)}</dd></div>
      </dl>
      <div className="lx-profile-tags">{l.specialties.map((t) => <span key={t}>{t}</span>)}</div>
      <div className="lx-profile-agenda">
        <b>Próximas consultas</b>
        <ul>
          {l.specialties.slice(0, 2).map((sp, i) => <li key={sp}><span>{i === 0 ? 'Mar 10:00 a.m.' : 'Mié 2:30 p.m.'}</span> Consulta sobre {sp.toLowerCase()}</li>)}
        </ul>
      </div>
    </div>
  )
}

/* Varios perfiles apilados que se turnan al frente */
function ProfileStack() {
  const list = pros.slice(0, 3)
  const [front, setFront] = useState(0)
  useEffect(() => {
    if (reduceMotion()) return
    const t = setInterval(() => setFront((f) => (f + 1) % list.length), 3600)
    return () => clearInterval(t)
  }, [list.length])
  return (
    <div className="lx-stack" onClick={() => setFront((f) => (f + 1) % list.length)} role="group" aria-label="Perfiles de abogados">
      {list.map((l, i) => {
        const pos = (i - front + list.length) % list.length
        return <ProfilePreview key={l.id} l={l} style={{ ['--pos' as string]: pos, zIndex: list.length - pos } as CSSProperties} />
      })}
      <div className="lx-stack-dots" aria-hidden="true">{list.map((l, i) => <i key={l.id} className={i === front ? 'on' : ''} />)}</div>
    </div>
  )
}

/* ---------- Quiénes somos ---------- */
const pillars: { icon: PhIcon; title: string; text: string }[] = [
  { icon: GlobeHemisphereWest, title: 'Acceso sin fronteras', text: 'Su abogado a un toque, esté donde esté.' },
  { icon: ChartLineUp, title: 'Resultados que se ven', text: 'Cada caso avanza con pasos reales, documentados y a la vista.' },
  { icon: Scales, title: 'El derecho en sus manos', text: 'Información sencilla para decidir con seguridad.' },
]

function AboutSection() {
  return (
    <section className="lx-about" id="nosotros">
      <div className="lx-wrap">
        <div className="lx-about-grid">
          <div className="lx-about-copy" data-reveal>
            <p className="lx-kicker"><Sparkle weight="fill" size={18} /> Quiénes somos · Hecho en Honduras</p>
            <h2>El derecho le pertenece a todas las personas</h2>
            <p className="lx-about-lead">Next Legal es una red abierta que acerca a cada persona a un abogado de trayectoria, sin distancias ni intermediarios, con procesos claros que se pueden seguir paso a paso.</p>
            <p className="lx-about-lead">Nacimos en Honduras con una convicción: el acceso a la justicia no debe tener fronteras.</p>
          </div>
          <div className="lx-about-visual" data-reveal><NetworkMap /></div>
        </div>
        <ul className="lx-pillars">
          {pillars.map((pl, i) => (
            <li key={pl.title} data-reveal style={{ ['--d' as string]: i + 1 }}>
              <span className="lx-pillar-icon"><pl.icon weight="fill" size={26} /></span>
              <div><b>{pl.title}</b><p>{pl.text}</p></div>
            </li>
          ))}
        </ul>
        <p className="lx-about-quote" data-reveal>Creemos en un futuro donde la confianza se construye con transparencia.</p>
      </div>
    </section>
  )
}

/* ---------- Familia: sección animada al desplazarse ---------- */
function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduceMotion()) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect(), vh = window.innerHeight
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
      el.style.setProperty('--p', p.toFixed(3))
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [])
  return ref
}

type Topic = { key: string; tab: string; img: string; alt: string; pos?: string; chips: string[]; title: string; hl: string[]; text: string; cta: string; cat: CategoryId }
const topics: Topic[] = [
  { key: 'familia', tab: 'Familia', img: asset('/img/temas/familia.jpg'), alt: 'Madre sonriendo con su hija en brazos en su negocio', chips: ['Pensión alimenticia', 'Custodia', 'Divorcio'],
    title: 'Pensión alimenticia, custodia y divorcio, con alguien que le explique cada paso.', hl: ['Pensión', 'alimenticia', 'custodia', 'divorcio'],
    text: 'Abogados de familia que le atienden en línea o en persona, con un precio claro desde el inicio.', cta: 'Ver abogados de familia', cat: 'familia' },
  { key: 'laboral', tab: 'Laboral', img: asset('/img/temas/laboral.jpg'), alt: 'Trabajador de construcción con casco durante su jornada', pos: 'center 22%', chips: ['Despidos', 'Prestaciones', 'Salarios'],
    title: 'Despidos, prestaciones y salarios: haga valer lo que su trabajo vale.', hl: ['Despidos', 'prestaciones', 'salarios'],
    text: 'Abogados laborales que le orientan sobre sus derechos y le acompañan hasta cobrar lo que le corresponde.', cta: 'Ver abogados laborales', cat: 'laboral' },
  { key: 'penal', tab: 'Penal', img: asset('/img/temas/penal.jpg'), alt: 'Familia abrazándose con alegría', chips: ['Defensa penal', 'Audiencias', 'Medidas cautelares'],
    title: 'Defensa penal para que usted y su familia tengan a alguien de su lado.', hl: ['Defensa', 'penal'],
    text: 'Abogados con experiencia en audiencias y procesos penales, listos para orientarle desde el primer contacto.', cta: 'Ver abogados penalistas', cat: 'penal' },
  { key: 'terrenos', tab: 'Terrenos', img: asset('/img/temas/terrenos.jpg'), alt: 'Agricultor sonriendo en su campo', chips: ['Compraventa', 'Escrituras', 'Herencias'],
    title: 'Terrenos, escrituras y herencias en regla, sin sorpresas.', hl: ['Terrenos', 'escrituras', 'herencias'],
    text: 'Compre, venda o herede con tranquilidad: su patrimonio en orden y con documentos claros.', cta: 'Ver abogados de propiedad', cat: 'inmuebles' },
  { key: 'negocios', tab: 'Negocios', img: asset('/img/temas/empresarial.jpg'), alt: 'Comerciante riendo en su puesto del mercado', pos: 'center 35%', chips: ['Contratos', 'Cobros', 'Permisos'],
    title: 'Su negocio, con contratos claros y cobros al día.', hl: ['negocio', 'contratos', 'cobros'],
    text: 'Asesoría para comerciantes y emprendedores: contratos, cobros a clientes y trámites del negocio.', cta: 'Ver abogados para negocios', cat: 'mercantil' },
]
const AUTOPLAY = 7000
const clean = (w: string) => w.replace(/[.,:;]/g, '')

function TopicsSection() {
  const ref = useScrollProgress<HTMLElement>()
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const go = (n: number) => setIdx((n + topics.length) % topics.length)
  const tp = topics[idx]
  return (
    <section className="lx-family lx-topics" ref={ref} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrusel" aria-label="Temas legales">
      <div className="lx-family-media">
        {topics.map((t, i) => (
          <img key={t.key} src={t.img} alt={i === idx ? t.alt : ''} aria-hidden={i !== idx} className={i === idx ? 'on' : ''} style={{ objectPosition: t.pos ?? 'center' }} loading={i === 0 ? 'eager' : 'lazy'} />
        ))}
        <ul className="lx-family-chips" key={`c-${tp.key}`}>
          {tp.chips.map((c, i) => <li key={c} style={{ ['--d' as string]: i }}><CheckCircle weight="fill" size={18} /> {c}</li>)}
        </ul>
        <button type="button" className="lx-topic-next" onClick={() => go(idx + 1)} aria-label={`Siguiente tema: ${topics[(idx + 1) % topics.length].tab}`}>
          <ArrowRight weight="bold" size={22} />
        </button>
      </div>
      <div className="lx-family-copy">
        <div className="lx-topic-tabs" role="tablist" aria-label="Elegir tema">
          {topics.map((t, i) => (
            <button key={t.key} type="button" role="tab" aria-selected={i === idx} className={i === idx ? 'on' : ''} onClick={() => go(i)} style={{ ['--dur' as string]: `${AUTOPLAY}ms` } as CSSProperties}>
              {t.tab}{i === idx && <i key={idx} className="lx-topic-bar" style={{ animationPlayState: paused ? 'paused' : 'running' }} onAnimationEnd={() => go(idx + 1)} />}
            </button>
          ))}
        </div>
        <div className="lx-topic-body" key={tp.key} aria-live="polite">
          <h2 className="lx-words" aria-label={tp.title}>
            {tp.title.split(' ').map((w, i) => (
              <span key={i} aria-hidden="true" className={tp.hl.includes(clean(w)) ? 'hl' : ''} style={{ ['--w' as string]: i } as CSSProperties}>{w} </span>
            ))}
          </h2>
          <p>{tp.text}</p>
          <Link to={`/buscar?cat=${tp.cat}`} className="lx-btn lx-btn-lg lx-btn-ink">
            <span>{tp.cta}</span>
            <span className="lx-btn-icon"><UsersThree weight="fill" size={24} /></span>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* Fotos que rotan con la frase "Para comerciantes, trabajadores y familias" */
const people = [
  { img: asset('/img/tranquilidad/comerciantes.jpg'), alt: 'Cocinera sonriendo en su negocio', label: 'comerciantes', pos: 'center 78%' },
  { img: asset('/img/tranquilidad/trabajadores.jpg'), alt: 'Campesino sonriendo con su sombrero', label: 'trabajadores', pos: 'center 30%' },
  { img: asset('/img/tranquilidad/familias.jpg'), alt: 'Abuela sonriendo con su nieta en brazos', label: 'familias', pos: 'center 25%' },
]

function PeopleRotator() {
  const [i, setI] = useState(0)
  // Se reinicia con cada cambio: un clic nunca provoca dos saltos seguidos
  useEffect(() => {
    if (reduceMotion()) return
    const t = setTimeout(() => setI((n) => (n + 1) % people.length), 4500)
    return () => clearTimeout(t)
  }, [i])
  return (
    <figure className="lx-photo lx-people" onClick={() => setI((n) => (n + 1) % people.length)}>
      <div className="lx-people-frame">
        {people.map((p, k) => <img key={p.img} src={p.img} alt={k === i ? p.alt : ''} aria-hidden={k !== i} className={k === i ? 'on' : ''} style={{ objectPosition: p.pos }} loading="lazy" />)}
      </div>
      <figcaption>
        <SealCheck weight="fill" size={22} />
        <span>Para <b key={people[i].label} className="lx-people-word">{people[i].label}</b></span>
        <span className="lx-people-dots" aria-hidden="true">{people.map((p, k) => <i key={p.label} className={k === i ? 'on' : ''} />)}</span>
      </figcaption>
    </figure>
  )
}

/* ---------- Contenido ---------- */
const promises = [
  { title: 'Profesionales con experiencia', text: 'Abogados colegiados, con resultados que usted puede consultar antes de elegir.' },
  { title: 'Precio claro desde el inicio', text: 'Usted conoce el costo de su consulta antes de confirmarla.' },
  { title: 'Su caso, siempre a la vista', text: 'Consulte cómo avanza su caso desde su celular, cuando lo necesite.' },
  { title: 'Confidencialidad total', text: 'Lo que usted comparte queda entre usted y su abogado.' },
]

const situations: { icon: PhIcon; say: string; cat: CategoryId }[] = [
  { icon: Briefcase, say: 'Me despidieron', cat: 'laboral' },
  { icon: HeartBreak, say: 'Me quiero divorciar', cat: 'familia' },
  { icon: HandCoins, say: 'Me deben dinero', cat: 'civil' },
  { icon: Buildings, say: 'Compro un terreno', cat: 'inmuebles' },
  { icon: Gavel, say: 'Tengo un caso penal', cat: 'penal' },
  { icon: FileText, say: 'Necesito un trámite', cat: 'tramites' },
]

// Logos oficiales en versión blanca. Su uso público requiere autorización de cada institución (ver public/aliados/LEEME.txt).
const allies: { name: string; logo: string; url: string; h: number }[] = [
  { name: 'Colegio de Abogados de Honduras', logo: asset('/aliados/cah.png'), url: 'https://www.colegiodeabogados.hn', h: 62 },
  { name: 'Cámara de Comercio e Industrias de Tegucigalpa', logo: asset('/aliados/ccit.png'), url: 'https://www.ccit.hn', h: 54 },
  { name: 'Cámara de Comercio e Industrias de Cortés', logo: asset('/aliados/ccic.png'), url: 'https://ccichonduras.org', h: 46 },
  { name: 'Consejo Hondureño de la Empresa Privada', logo: asset('/aliados/cohep.png'), url: 'https://www.cohep.org', h: 34 },
  { name: 'Asociación Hondureña de Maquiladores', logo: asset('/aliados/ahm.png'), url: 'https://www.ahm-honduras.com', h: 46 },
  { name: 'Universidad Nacional Autónoma de Honduras', logo: asset('/aliados/unah.png'), url: 'https://www.unah.edu.hn', h: 66 },
  { name: 'Universidad Tecnológica de Honduras', logo: asset('/aliados/uth.png'), url: 'https://www.uth.hn', h: 40 },
  { name: 'Consortium Legal', logo: asset('/aliados/consortium.png'), url: 'https://consortiumlegal.com', h: 42 },
  { name: 'Arias', logo: asset('/aliados/arias.png'), url: 'https://www.ariaslaw.com', h: 38 },
  { name: 'García & Bodán', logo: asset('/aliados/garciabodan.png'), url: 'https://garciabodan.com', h: 34 },
]

const sedes = [
  { city: 'Tegucigalpa', detail: 'Con cita previa' },
  { city: 'San Pedro Sula', detail: 'Con cita previa' },
]

const pros = ['andrea-castillo', 'roberto-zelaya', 'valeria-paz', 'daniel-rivera'].map((id) => getLawyer(id)).filter((l): l is Lawyer => !!l)
const minPrice = Math.min(...pros.map((l) => l.consultationPrice))

/** Abre el registro con el método de contacto elegido. */
function openJoin(_via: 'correo', role: LeadRole = 'cliente') {
  window.dispatchEvent(new CustomEvent('nl:join', { detail: { role } }))
  document.getElementById('unete')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' })
}

/* ---------- Ficha de abogado destacada ---------- */
function ProCard({ l, i }: { l: Lawyer; i: number }) {
  return (
    <article className="lx-pro" data-reveal style={{ ['--d' as string]: i % 2 }}>
      <div className="lx-pro-photo">
        <img src={l.portrait} alt={l.name} loading="lazy" />
        <span className="lx-pro-badge"><SealCheck weight="fill" size={16} /> Verificado</span>
      </div>
      <div className="lx-pro-body">
        <p className="lx-pro-area">{categoryName(l.category)}</p>
        <h3>{l.name}</h3>
        <p className="lx-pro-meta"><MapPin weight="fill" size={16} /> {l.city} <span>Colegiado N.º {l.bar}</span></p>
        <div className="lx-pro-price">
          <b>{formatLempiras(l.consultationPrice).replace('.00', '')}</b>
          <small>por consulta de 1 hora</small>
        </div>
        <dl className="lx-pro-stats">
          <div><dt>Años de experiencia</dt><dd>{l.years}</dd></div>
          <div><dt>Casos resueltos</dt><dd>{l.casesSolved}</dd></div>
          <div><dt>Calificación</dt><dd><Star weight="fill" size={20} className="star" /> {l.rating.toFixed(1)}</dd></div>
        </dl>
        <ul className="lx-pro-helps">
          {(l.helps ?? []).map((h) => <li key={h}><CheckCircle weight="fill" size={20} /> {h}</li>)}
        </ul>
        <div className="lx-pro-actions">
          <Link to={`/agendar/${l.id}`} className="lx-btn"><CalendarCheck weight="fill" size={20} /> Agendar consulta</Link>
          <Link to={`/abogado/${l.id}`} className="lx-link">Ver perfil completo</Link>
        </div>
      </div>
    </article>
  )
}

/* ---------- Mapa de Honduras ---------- */
function HondurasMap() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelectorAll<SVGPathElement>('.hn-dep').forEach((p, i) => p.style.setProperty('--i', String(i)))
  }, [])
  return (
    <figure className="lx-map" data-reveal>
      <div ref={ref} className="lx-map-svg" dangerouslySetInnerHTML={{ __html: hondurasSvg }} />
      <span className="lx-pin" style={{ left: '23.5%', top: '32%' }}><i /><b>San Pedro Sula</b></span>
      <span className="lx-pin lx-pin-right" style={{ left: '36.5%', top: '63%' }}><i /><b>Tegucigalpa</b></span>
      <figcaption>Mapa: Wikimedia Commons, CC BY-SA 4.0</figcaption>
    </figure>
  )
}

const steps: { icon: PhIcon; title: string; text: string; more: string[] }[] = [
  { icon: ChatCircleText, title: 'Cuéntenos su problema', text: 'Elija su caso o escríbalo como usted lo diría.', more: ['Categorías claras: familia, laboral, penal y más', 'Le sugerimos la especialidad indicada'] },
  { icon: UserCheck, title: 'Elija a su abogado', text: 'Compare experiencia, especialidad y la opinión de otros clientes.', more: ['Tarifa, años de experiencia y reseñas', 'Perfil completo antes de decidir'] },
  { icon: CalendarCheck, title: 'Agende y pague', text: 'Por videollamada o en persona. El precio que ve es el precio que paga.', more: ['Elija fecha, hora y modalidad', 'Pago seguro con tarjeta'] },
  { icon: FolderOpen, title: 'Siga su caso', text: 'Converse con su abogado y vea cada avance desde su celular.', more: ['Chat directo con su abogado', 'Documentos y avances en un solo lugar'] },
]

function Steps() {
  const [active, setActive] = useState(0)
  return (
    <ol className="lx-steps lx-steps-x" data-reveal>
      {steps.map((st, i) => (
        <li key={st.title} className={i === active ? 'on' : ''} style={{ ['--d' as string]: i } as CSSProperties}>
          <button type="button" onClick={() => setActive(i)} aria-expanded={i === active}>
            <span className="lx-step-n">{i + 1}</span>
            <span className="lx-step-icon"><st.icon weight="fill" size={22} /></span>
            <h3>{st.title}</h3>
            <p>{st.text}</p>
            <div className="lx-step-more-wrap"><ul className="lx-step-more">{st.more.map((m) => <li key={m}><CheckCircle weight="fill" size={18} /> {m}</li>)}</ul></div>
          </button>
        </li>
      ))}
    </ol>
  )
}

/** true mientras la sección con ese id está a la vista (la barra se oculta en el registro). */
function useInView(id: string, threshold: number) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = document.getElementById(id)
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [id, threshold])
  return on
}

/** true cuando la página bajó más de `px`: la barra fija toma fondo. */
function useScrolled(px: number) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const check = () => setOn(window.scrollY > px)
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [px])
  return on
}

function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.lx [data-reveal]'))
    if (reduceMotion() || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target) } })
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])
}

export default function Landing() {
  useReveal()
  const scrolled = useScrolled(24)
  const atJoin = useInView('unete', 0.2)
  const launched = isLaunched()
  return (
    <div className="lx">
      <LiveLines tone="light" className="lx-page-bg" />
      {/* 1. Quién es el abogado */}
      <nav className={`lx-nav lx-nav-fixed ${scrolled ? 'is-scrolled' : ''} ${atJoin ? 'is-hidden' : ''}`} aria-label="Navegación principal">
        <BrandLogo tone="light" className="lx-nav-logo" />
        <div className="lx-nav-links">
          <a href="#nosotros">Nosotros</a>
          <a href="#abogados">Abogados</a>
          <a href="#para-abogados">Soy abogado</a>
          {launched
            ? <Link to="/entrar" className="lx-btn lx-btn-sm"><SignIn weight="fill" size={18} /> Iniciar sesión</Link>
            : <button type="button" className="lx-btn lx-btn-sm" onClick={() => openJoin('correo')}><EnvelopeSimple weight="fill" size={18} /> Crear cuenta</button>}
        </div>
      </nav>
      <section className="lx-hero">
        <LiveLines />
        <div className="lx-hero-grid">
          <div className="lx-hero-copy" data-reveal>
            <p className="lx-kicker"><Sparkle weight="fill" size={18} /> Tecnología legal hecha en Honduras</p>
            <h1>El abogado que usted necesita, a un toque de distancia.</h1>
            <p className="lx-lead">Abogados de trayectoria, precios claros desde el inicio y su caso siempre a la vista. Desde su celular, esté donde esté.</p>
            <div className="lx-ctas">
              <button type="button" className="lx-btn lx-btn-lg" onClick={() => openJoin('correo')}>
                <span>Crear mi cuenta con correo</span>
                <span className="lx-btn-icon"><EnvelopeSimple weight="fill" size={22} /></span>
              </button>
              <Link to="/buscar" className="lx-btn lx-btn-lg lx-btn-ghost"><MagnifyingGlass size={20} /> Buscar abogado</Link>
            </div>
            <HeroLive />
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* Instituciones en bucle */}
      <section className="lx-allies" aria-label="Instituciones del sistema legal y empresarial de Honduras">
        <p>Instituciones del sistema legal y empresarial de Honduras</p>
        <div className="lx-marquee">
          <div className="lx-marquee-track">
            {[...allies, ...allies].map((a, i) => (
              <a key={i} className="lx-ally" href={a.url} target="_blank" rel="noopener noreferrer" title={a.name} aria-hidden={i >= allies.length} tabIndex={i >= allies.length ? -1 : undefined}>
                <img src={a.logo} alt={i < allies.length ? a.name : ''} style={{ height: a.h }} loading="lazy" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <AboutSection />

      {/* 2. Garantías */}
      <section className="lx-section" id="confianza">
        <div className="lx-wrap lx-ledger">
          <div className="lx-ledger-side" data-reveal>
            <h2>Su tranquilidad es lo primero</h2>
            <PeopleRotator />
          </div>
          <ul>
            {promises.map((f, i) => (
              <li key={f.title} data-reveal style={{ ['--d' as string]: i }}>
                <b className="lx-promise-title"><SealCheck weight="fill" size={26} /> {f.title}</b>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. ¿Qué te pasó? */}
      <section className="lx-section lx-paper">
        <div className="lx-wrap">
          <h2 className="lx-h2" data-reveal>¿Cuál es su problema?</h2>
          <p className="lx-sub" data-reveal>Elija su situación y le presentamos a los abogados indicados.</p>
          <div className="lx-signs">
            {situations.map((s, i) => (
              <Link key={s.say} to={`/buscar?cat=${s.cat}`} className="lx-sign" data-reveal style={{ ['--d' as string]: i }}>
                <span className="lx-sign-icon"><s.icon size={32} weight="fill" /></span>
                <span className="lx-sign-text"><b>{s.say}</b><small>{categoryName(s.cat)}</small></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TopicsSection />

      {/* 4. Abogados */}
      <section className="lx-section" id="abogados">
        <div className="lx-wrap">
          <h2 className="lx-h2" data-reveal>Conozca a su abogado</h2>
          <p className="lx-sub" data-reveal>Conozca su experiencia, su tarifa y lo que opinan sus clientes antes de agendar.</p>
          <div className="lx-pros">
            {pros.map((l, i) => <ProCard key={l.id} l={l} i={i} />)}
          </div>
        </div>
      </section>

      {/* 5. Para toda Honduras: mapa vivo */}
      <section className="lx-country">
        <LiveLines />
        <div className="lx-wrap lx-country-grid">
          <div className="lx-country-copy" data-reveal>
            <h2>Para toda Honduras</h2>
            <p>Desde cualquier departamento puede hablar con su abogado por videollamada. Y si prefiere verlo en persona, le esperamos en Tegucigalpa o en San Pedro Sula.</p>
            <dl className="lx-country-stats">
              <div><dt>Departamentos con atención en línea</dt><dd>18</dd></div>
              <div><dt>Sedes para atenderle en persona</dt><dd>2</dd></div>
              <div><dt>Consultas desde</dt><dd>{formatLempiras(minPrice).replace('.00', '')}</dd></div>
            </dl>
            <ul className="lx-sedes">
              {sedes.map((sd) => (
                <li key={sd.city} className="lx-sede">
                  <span className="lx-sede-icon"><MapPin weight="fill" size={26} /></span>
                  <div><b>Sede {sd.city}</b><small>{sd.detail}</small></div>
                  <Link to="/buscar" className="lx-sede-btn"><CalendarCheck weight="fill" size={18} /> Agendar cita</Link>
                </li>
              ))}
              <li className="lx-sede lx-sede-online">
                <span className="lx-sede-icon"><VideoCamera weight="fill" size={26} /></span>
                <div><b>En línea</b><small>Por videollamada</small></div>
                <Link to="/buscar" className="lx-sede-btn"><VideoCamera weight="fill" size={18} /> Consultar</Link>
              </li>
            </ul>
          </div>
          <HondurasMap />
        </div>
      </section>

      {/* 6. Pasos */}
      <section className="lx-section">
        <div className="lx-wrap">
          <h2 className="lx-h2" data-reveal>Así funciona</h2>
          <Steps />
        </div>
      </section>

      {/* 7. Para abogados */}
      <section className="lx-split" id="para-abogados">
        <div className="lx-split-visual" data-reveal>
          <ProfileStack />
        </div>
        <div className="lx-split-copy" data-reveal>
          <h2>¿Es usted abogado? Su perfil profesional trabaja por usted.</h2>
          <ul>
            <li><span className="lx-pillar-icon lx-mini"><UserCheck weight="fill" size={20} /></span> Reciba clientes que ya conocen su especialidad y su tarifa.</li>
            <li><span className="lx-pillar-icon lx-mini"><CalendarCheck weight="fill" size={20} /></span> Administre su agenda, sus cobros y sus expedientes en un solo lugar.</li>
            <li><span className="lx-pillar-icon lx-mini"><GlobeHemisphereWest weight="fill" size={20} /></span> Atienda clientes de todo el país desde su oficina.</li>
          </ul>
          <button type="button" className="lx-btn lx-btn-lg lx-btn-ink" onClick={() => openJoin('correo', 'abogado')}><EnvelopeSimple weight="fill" size={20} /> Crear cuenta de abogado</button>
        </div>
      </section>

      {/* 8. Registro con folio */}
      <JoinSection />

      <footer className="lx-footer">
        <BrandLogo tone="light" animated={false} className="lx-footer-logo" />
        <p>© {YEAR} Next Legal. Imágenes con fines ilustrativos.</p>
        <Link to="/entrar">Iniciar sesión</Link>
      </footer>
    </div>
  )
}

/* ---------- Lista de espera en vivo ---------- */
function useWaitlist() {
  const [n, setN] = useState(() => WAITLIST_BASE + listLeads().length)
  useEffect(() => {
    const on = () => setN(WAITLIST_BASE + listLeads().length)
    window.addEventListener('nl:lead', on)
    return () => window.removeEventListener('nl:lead', on)
  }, [])
  return n
}

function HeroLive() {
  const n = useWaitlist()
  return <div className="lx-hero-live"><LiveBadge count={n} /></div>
}

function LiveBadge({ count }: { count: number }) {
  return (
    <span className="lx-live-row">
      <span className="lx-live"><i aria-hidden="true" /> En vivo</span>
      <span><b>{count.toLocaleString('es-HN')}</b> personas en lista de espera</span>
    </span>
  )
}

/* ---------- Registro ---------- */
const clientProblems = ['Despido o salario', 'Divorcio o pensión', 'Deudas o cobros', 'Terrenos o herencias', 'Caso penal', 'Trámites o documentos', 'Mi negocio', 'Otro']
const lawyerAreas = ['Laboral', 'Civil', 'Penal', 'Familia', 'Mercantil', 'Notarial', 'Administrativo', 'Constitucional', 'Tributario', 'Agrario y propiedad', 'Migratorio', 'Ambiental', 'Propiedad intelectual', 'Bancario y financiero']

function Countdown() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  const t = timeLeft(LAUNCH_DATE, now)
  return (
    <div className="lx-countdown" aria-label={`Faltan ${t.days} días para el lanzamiento`}>
      {([[t.days, 'días'], [t.hours, 'horas'], [t.minutes, 'min'], [t.seconds, 'seg']] as const).map(([n, l]) => (
        <span key={l}><b>{pad2(n)}</b><small>{l}</small></span>
      ))}
    </div>
  )
}

function JoinSection() {
  const [role, setRole] = useState<LeadRole>('cliente')
  const [done, setDone] = useState<{ first: string; folio: string; url: string } | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [picks, setPicks] = useState<string[]>([])
  const nameRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<LeadErrors>({})
  const count = useWaitlist()

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ role: LeadRole }>).detail
      setRole(d.role); setPicks([]); setDone(null)
      setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 500)
    }
    window.addEventListener('nl:join', on)
    return () => window.removeEventListener('nl:join', on)
  }, [])

  const options = role === 'cliente' ? clientProblems : lawyerAreas
  const toggle = (o: string) => setPicks((p) => role === 'cliente' ? (p[0] === o ? [] : [o]) : (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]))
  const chooseRole = (r: LeadRole) => { setRole(r); setPicks([]) }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const need = picks.join(', ')
    const r = validateLead({ name, phone: '', email, via: 'correo', role, need })
    if (!r.ok) return setErrors(r.errors)
    saveLead(r.value)
    const total = WAITLIST_BASE + listLeads().length
    const folio = formatFolio(total)
    window.dispatchEvent(new Event('nl:lead'))
    const qs = new URLSearchParams({ nombre: r.value.name, correo: r.value.email, folio, rol: role, ...(need ? { tema: need } : {}) })
    setDone({ first: r.value.name.split(' ')[0], folio, url: `${import.meta.env.BASE_URL}correo?${qs}` })
    setErrors({})
  }

  // En el kiosko el formulario se limpia solo para la siguiente persona.
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => { setDone(null); setName(''); setEmail(''); setPicks([]) }, 20000)
    return () => clearTimeout(t)
  }, [done])

  const digits = formatFolio(count).split('')

  return (
    <section className="lx-join" id="unete">
      <LiveLines />
      <div className="lx-wrap lx-join-grid">
        <div className="lx-join-copy" data-reveal>
          <h2>Sea de los primeros en usar Next Legal</h2>
          <p>Cree su cuenta hoy y reciba acceso prioritario el día del lanzamiento. Cada registro recibe un número en orden de llegada.</p>
          <div className="lx-counter" aria-live="polite">
            <div className="lx-counter-digits" aria-hidden="true">{digits.map((d, i) => <span key={`${i}-${d}`}>{d}</span>)}</div>
            <LiveBadge count={count} />
          </div>
          <div className="lx-launch">
            <p>El lanzamiento es en</p>
            <Countdown />
          </div>
        </div>

        <div className="lx-form-card" data-reveal>
          {done ? (
            <div className="lx-ticket" role="status">
              <p>Gracias, {done.first}. Su número de registro es</p>
              <div className="lx-ticket-no">N.º {done.folio}</div>
              <p className="lx-muted">Le enviamos un correo de bienvenida con su número y la cuenta regresiva para el lanzamiento.</p>
              <div className="lx-ticket-seal"><Seal stamped /></div>
              <div className="lx-ticket-actions">
                <a href={done.url} target="_blank" rel="noopener" className="lx-btn lx-btn-lg"><EnvelopeSimple weight="fill" size={20} /> Ver el correo</a>
                <Link to="/inicio" className="lx-btn lx-btn-lg lx-btn-ink lx-btn-home"><House weight="fill" size={20} /> Ir al inicio</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <fieldset className="lx-role">
                <legend>¿Qué busca?</legend>
                <label className={role === 'cliente' ? 'on' : ''}><input type="radio" name="role" checked={role === 'cliente'} onChange={() => chooseRole('cliente')} /><UserCheck weight="fill" size={22} /> Necesito un abogado</label>
                <label className={role === 'abogado' ? 'on' : ''}><input type="radio" name="role" checked={role === 'abogado'} onChange={() => chooseRole('abogado')} /><Briefcase weight="fill" size={22} /> Soy abogado</label>
              </fieldset>
              <label className="lx-field">
                <span>Nombre</span>
                <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Su nombre y apellido" aria-invalid={!!errors.name} />
                {errors.name && <small className="lx-err">{errors.name}</small>}
              </label>
              <label className="lx-field">
                <span>Correo electrónico</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" placeholder="nombre@gmail.com" aria-invalid={!!errors.email} />
                {errors.email && <small className="lx-err">{errors.email}</small>}
              </label>
              <fieldset className="lx-picks" key={role}>
                <legend>{role === 'cliente' ? '¿Cuál es su problema?' : '¿En qué áreas ejerce? Puede elegir varias'}</legend>
                <div>
                  {options.map((o, i) => (
                    <button key={o} type="button" aria-pressed={picks.includes(o)} className={picks.includes(o) ? 'on' : ''} onClick={() => toggle(o)} style={{ ['--d' as string]: i } as CSSProperties}>
                      {picks.includes(o) && <CheckCircle weight="fill" size={16} />} {o}
                    </button>
                  ))}
                </div>
              </fieldset>
              <button className="lx-btn lx-btn-lg lx-btn-block">
                <span>{role === 'cliente' ? 'Crear mi cuenta' : 'Crear cuenta de abogado'}</span>
                <span className="lx-btn-icon"><EnvelopeSimple weight="fill" size={22} /></span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
