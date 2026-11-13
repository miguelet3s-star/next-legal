import { ArrowLeft, ChatCircleText, PaperPlaneRight } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLawyer } from '../data/mock'
import { markThreadRead, sendMessage, threadsOf } from '../lib/db'
import { formatStamp, nowStamp } from '../lib/dates'
import { update } from '../lib/store'
import { Avatar, EmptyState, PageHead, categoryName } from './ui'
import { newId, useApp } from '../lib/app'

interface Person { id: string; name: string; photo?: string; sub: string }

/** Mensajes entre cliente y abogado. Cada quien ve solo sus propias conversaciones. */
export default function Chat() {
  const { me, db } = useApp()
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const isClient = me.role === 'cliente'

  // Personas con las que se puede conversar: con quienes ya hay un caso, una consulta o mensajes.
  const ids = [...new Set([...db.messages, ...db.cases, ...db.consultations].map((r) => (isClient ? r.lawyerId : r.clientId)))]
  const people = new Map<string, Person>()
  for (const id of ids) {
    if (isClient) {
      const l = getLawyer(id)
      if (l) people.set(id, { id, name: l.name, photo: l.photo, sub: categoryName(l.category) })
    } else {
      const c = db.clients.find((x) => x.id === id)
      if (c) people.set(id, { id, name: c.name, sub: db.cases.find((x) => x.clientId === id)?.title ?? 'Consulta' })
    }
  }

  const threads = threadsOf(db.messages, me.role)
  const otherOf = (t: { clientId: string; lawyerId: string }) => (isClient ? t.lawyerId : t.clientId)
  const chosen = params.get('con')
  const activeId = chosen && people.has(chosen) ? chosen : threads[0] ? otherOf(threads[0]) : undefined
  const active = activeId ? people.get(activeId) : undefined
  const pair = active ? { clientId: isClient ? me.userId : active.id, lawyerId: isClient ? active.id : me.userId } : undefined
  const messages = pair ? db.messages.filter((m) => m.clientId === pair.clientId && m.lawyerId === pair.lawyerId).sort((a, b) => a.at.localeCompare(b.at)) : []
  const withoutThread = [...people.values()].filter((p) => !threads.some((t) => otherOf(t) === p.id))

  // En celular la conversación solo se abre al elegirla; en pantallas anchas se muestra la primera.
  const visible = !!chosen || (typeof window !== 'undefined' && window.matchMedia('(min-width: 761px)').matches)
  useEffect(() => {
    if (pair && visible) update((d) => markThreadRead(d, pair.clientId, pair.lawyerId, me.role))
    end.current?.scrollIntoView({ block: 'end' })
  }, [pair?.clientId, pair?.lawyerId, messages.length, visible, me.role]) // eslint-disable-line react-hooks/exhaustive-deps

  const send = (e: FormEvent) => {
    e.preventDefault()
    if (!pair || !text.trim()) return
    update((d) => sendMessage(d, { id: newId(), ...pair, from: me.role, text, at: nowStamp() }))
    setText('')
  }

  if (people.size === 0) {
    return (
      <div className="page">
        <PageHead title="Mensajes" />
        <EmptyState icon={ChatCircleText} title="Aún no tiene conversaciones" text={isClient ? 'Cuando agende una consulta podrá escribirle a su abogado desde aquí.' : 'Cuando un cliente agende una consulta con usted podrá escribirle desde aquí.'} />
      </div>
    )
  }

  const row = (p: Person, last?: string, stamp?: string, unread = 0) => (
    <li key={p.id}>
      <button className={`thread ${p.id === activeId ? 'active' : ''}`} onClick={() => setParams({ con: p.id })}>
        <Avatar name={p.name} photo={p.photo} size={46} />
        <span className="thread-body"><b>{p.name}</b><small className={unread ? '' : 'muted'}>{last ?? p.sub}</small></span>
        <span className="thread-meta">{stamp && <small className="muted">{stamp}</small>}{unread > 0 && <span className="count">{unread}</span>}</span>
      </button>
    </li>
  )

  return (
    <div className="page">
      <PageHead title="Mensajes" />
      <div className={`chat ${chosen ? 'has-active' : ''}`}>
        <ul className="chat-list">
          {threads.map((t) => { const p = people.get(otherOf(t)); return p ? row(p, `${t.last.from === me.role ? 'Usted: ' : ''}${t.last.text}`, formatStamp(t.last.at), t.unread) : null })}
          {withoutThread.map((p) => row(p))}
        </ul>

        {active && (
          <section className="chat-thread" aria-label={`Conversación con ${active.name}`}>
            <header className="chat-head">
              <button className="icon-btn chat-back" aria-label="Volver a las conversaciones" onClick={() => setParams({})}><ArrowLeft size={20} weight="bold" /></button>
              <Avatar name={active.name} photo={active.photo} size={42} />
              <div><b>{active.name}</b><small className="muted">{active.sub}</small></div>
            </header>
            <div className="chat-scroll">
              {messages.length === 0 && <p className="muted center small">Escriba el primer mensaje para {active.name}.</p>}
              {messages.map((m) => (
                <div key={m.id} className={`bubble ${m.from === me.role ? 'mine' : ''}`}>
                  <p>{m.text}</p>
                  <small>{formatStamp(m.at)}</small>
                </div>
              ))}
              <div ref={end} />
            </div>
            <form className="chat-compose" onSubmit={send}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escriba su mensaje" aria-label="Mensaje" maxLength={1000} />
              <button className="btn btn-primary" disabled={!text.trim()} aria-label="Enviar mensaje"><PaperPlaneRight size={20} weight="fill" /></button>
            </form>
          </section>
        )}
      </div>
    </div>
  )
}
