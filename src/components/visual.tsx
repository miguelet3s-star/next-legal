import { Check, CheckCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import type { Lawyer } from '../data/mock'
import type { CaseStatus } from '../lib/db'
import { CASE_ROUTE, caseStage } from '../lib/db'
import type { IsoDate } from '../lib/dates'
import { dayNumber, monthShort } from '../lib/dates'
import type { Cents } from '../lib/money'
import { formatLempiras } from '../lib/money'
import { useToasts } from '../lib/toast'

/** Líneas onduladas de papel de seguridad, como en los documentos legales. */
export function Guilloche() {
  const lines = Array.from({ length: 9 }, (_, i) => {
    const y = 30 + i * 22
    return `M-20 ${y} C 180 ${y - 70 + i * 6}, 320 ${y + 80 - i * 5}, 520 ${y} S 860 ${y - 60 + i * 4}, 1060 ${y + 10} S 1300 ${y + 50}, 1460 ${y - 20}`
  })
  return (
    <svg className="guilloche" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden="true">
      {lines.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

/** Retrato dentro de un arco, el marco de las personas en Next Legal. */
export function Arch({ src, cover = false, className = '' }: { src: string; cover?: boolean; className?: string }) {
  return (
    <span className={`arch ${cover ? 'arch-cover' : ''} ${className}`} aria-hidden="true">
      <img src={src} alt="" loading="lazy" />
    </span>
  )
}

export function LawyerArch({ lawyer, className = '' }: { lawyer: Lawyer; className?: string }) {
  return lawyer.portrait ? <Arch src={lawyer.portrait} className={className} /> : <Arch src={lawyer.photo ?? ''} cover className={className} />
}

/** Ruta del caso: cuatro etapas, con la actual resaltada. */
export function CaseRoute({ status, compact = false }: { status: CaseStatus; compact?: boolean }) {
  const stage = caseStage(status)
  return (
    <ol className={`route ${compact ? 'route-compact' : ''}`} style={{ '--stage': stage } as React.CSSProperties} aria-label={`Etapa del caso: ${CASE_ROUTE[stage]}`}>
      {CASE_ROUTE.map((label, i) => (
        <li key={label} className={i < stage ? 'past' : i === stage ? 'now' : ''} aria-current={i === stage ? 'step' : undefined}>
          <span className="route-dot">{i < stage || stage === 3 ? <Check size={compact ? 10 : 14} weight="bold" /> : null}</span>
          {!compact && <small>{label}</small>}
        </li>
      ))}
    </ol>
  )
}

/** Sello de tinta con la etapa del caso. */
export function Stamp({ status }: { status: CaseStatus }) {
  return <span className={`stamp stamp-${caseStage(status)}`}>{CASE_ROUTE[caseStage(status)]}</span>
}

export function Toaster() {
  const toasts = useToasts()
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className="toast"><CheckCircle size={22} weight="fill" /> {t.text}</div>)}
    </div>
  )
}

/** Importe que sube contando hasta su valor al aparecer. */
export function CountMoney({ cents, className = '' }: { cents: Cents; className?: string }) {
  const [anim, setAnim] = useState<Cents | null>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || cents === 0) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700)
      // Se cuenta en lempiras enteros para no mostrar centavos sueltos durante la animación.
      setAnim(t === 1 ? null : Math.round((cents * (1 - Math.pow(1 - t, 3))) / 100) * 100)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [cents])
  const shown = anim ?? cents
  return <b className={`big-money ${className}`}>{formatLempiras(shown)}</b>
}

/** Barras de lo ganado por semana. La semana actual va resaltada. */
export function WeekBars({ weeks }: { weeks: { start: IsoDate; total: Cents }[] }) {
  const max = Math.max(...weeks.map((w) => w.total), 1)
  return (
    <ol className="bars" aria-label="Ganado por semana">
      {weeks.map((w, i) => (
        <li key={w.start} className={i === weeks.length - 1 ? 'now' : ''} title={`Semana del ${dayNumber(w.start)} de ${monthShort(w.start)}: ${formatLempiras(w.total)}`}>
          <span className="bar-value">{w.total > 0 ? `L ${(w.total / 100).toLocaleString('en-US')}` : ''}</span>
          <span className="bar" style={{ height: `${Math.max(4, (w.total / max) * 100)}%`, animationDelay: `${i * 60}ms` }} />
          <small>{dayNumber(w.start)} {monthShort(w.start)}</small>
        </li>
      ))}
    </ol>
  )
}

/** Arco de la jornada: el día de trabajo de extremo a extremo, con cada consulta en su hora. */
export function DayArc({ from, to, now, marks, label }: { from: string; to: string; now: string; marks: { time: string; done: boolean }[]; label: string }) {
  const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  const a = mins(from), b = Math.max(mins(to), a + 60)
  const pos = (t: string) => Math.min(1, Math.max(0, (mins(t) - a) / (b - a)))
  const R = 130, LEN = Math.PI * R
  const pt = (f: number) => ({ x: 160 - R * Math.cos(Math.PI * f), y: 160 - R * Math.sin(Math.PI * f) })
  const f = pos(now)
  const sun = pt(f)
  const state = mins(now) < a ? 'Aún no empieza' : mins(now) >= b ? 'Jornada terminada' : 'En jornada'
  return (
    <div className="day-arc">
      <svg viewBox="0 0 320 186" role="img" aria-label={`Su jornada de ${from} a ${to}. ${label}`}>
        <defs>
          <linearGradient id="arc-g" x1="0" x2="1"><stop offset="0" stopColor="#5b8cff" /><stop offset="1" stopColor="#7fe3f7" /></linearGradient>
        </defs>
        <path d="M30 160 A130 130 0 0 1 290 160" className="arc-track" />
        <path d="M30 160 A130 130 0 0 1 290 160" className="arc-progress" stroke="url(#arc-g)" strokeDasharray={LEN} strokeDashoffset={LEN * (1 - f)} style={{ '--len': LEN } as React.CSSProperties} />
        {marks.map((m) => { const p = pt(pos(m.time)); return <circle key={m.time} cx={p.x} cy={p.y} r="8" className={`arc-mark ${m.done ? 'done' : ''}`} /> })}
        <circle cx={sun.x} cy={sun.y} r="15" className="arc-sun-glow" />
        <circle cx={sun.x} cy={sun.y} r="7" className="arc-sun" />
      </svg>
      <div className="day-arc-center"><small>{state}</small><b>{marks.length}</b><span>{label}</span></div>
      <div className="day-arc-ends"><small>{formatHour(from)}</small><small>{formatHour(to)}</small></div>
    </div>
  )
}

function formatHour(t: string) {
  const h = Number(t.slice(0, 2))
  return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'a.m.' : 'p.m.'}`
}

/** Revela paneles y tarjetas cuando entran en pantalla. Se llama una vez por página. */
export function useReveal(key: string) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    const els = [...document.querySelectorAll<HTMLElement>('.content .panel, .content .folder, .content .cita, .content .ticket, .content .week, .content .timeline, .content .chat')]
      .filter((el) => !el.closest('.stagger') && el.getBoundingClientRect().top > window.innerHeight * 0.85)
    els.forEach((el) => el.classList.add('rv'))
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target) } })
    }, { rootMargin: '0px 0px -8% 0px' })
    els.forEach((el) => io.observe(el))
    return () => { io.disconnect(); els.forEach((el) => el.classList.remove('rv', 'rv-in')) }
  }, [key])
}
