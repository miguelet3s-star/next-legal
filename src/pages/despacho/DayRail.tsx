import { useState } from 'react'
import { getLawyer } from '../../data/mock'
import { useApp } from '../../lib/app'
import type { IsoDate } from '../../lib/dates'
import { formatTime, hourSlots, today } from '../../lib/dates'
import { effectiveSettings } from '../../lib/lawyers'
import { ConsultRow } from './ConsultRow'

/** El día del abogado hora por hora: consultas en su lugar y horas libres a la vista. */
export function DayRail({ date }: { date: IsoDate }) {
  const { me, db } = useApp()
  const [nowHour] = useState(() => new Date().getHours())
  const s = effectiveSettings(db, getLawyer(me.userId)!)
  const list = db.consultations.filter((c) => c.date === date && (c.status === 'confirmada' || c.status === 'realizada'))
  const hours = [...new Set([...hourSlots(s.from, s.to), ...list.map((c) => c.time)])].sort()
  const isToday = date === today()

  return (
    <ol className="rail">
      {hours.map((h) => {
        const c = list.find((x) => x.time === h)
        const hour = Number(h.slice(0, 2))
        const cls = [c ? 'busy' : 'free', isToday && hour === nowHour ? 'now' : '', isToday && hour < nowHour ? 'gone' : ''].join(' ')
        return (
          <li key={h} className={`rail-row ${cls}`}>
            <time>{formatTime(h)}</time>
            <span className="rail-mark" aria-hidden="true" />
            {c ? <ConsultRow c={c} showTime={false} /> : <span className="rail-free">{isToday && hour === nowHour ? 'Ahora, libre' : 'Libre'}</span>}
          </li>
        )
      })}
    </ol>
  )
}
