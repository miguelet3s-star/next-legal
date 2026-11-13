import { Money } from '@phosphor-icons/react'
import { ConsultChip, EmptyState, PageHead } from '../../components/ui'
import { useApp } from '../../lib/app'
import { CountMoney, WeekBars } from '../../components/visual'
import { lawyerIncome, weeklyIncome } from '../../lib/db'
import { formatShort, monthName, today } from '../../lib/dates'
import { formatLempiras } from '../../lib/money'

export default function Ingresos() {
  const { db } = useApp()
  const ref = today()
  const month = lawyerIncome(db.consultations, ref.slice(0, 7))
  const all = lawyerIncome(db.consultations)
  const rows = db.consultations.filter((c) => c.status === 'realizada' || c.status === 'confirmada').sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))

  return (
    <div className="page narrow">
      <PageHead title="Ingresos" sub="Usted recibe el precio completo de cada consulta. El servicio de Next Legal lo paga el cliente aparte." />
      {rows.length === 0 ? <EmptyState icon={Money} title="Aún no tiene ingresos" text="Sus consultas realizadas aparecerán aquí con su importe." /> : (
        <>
          <section className="panel income-hero">
            <div className="income-pair">
              <span><small className="muted">Ganado en {monthName(ref)}</small><CountMoney cents={month.earned} /></span>
              <span><small className="muted">Por consultas confirmadas</small><b className="big-money soft">{formatLempiras(all.upcoming)}</b></span>
              <span><small className="muted">Ganado en total</small><b className="big-money soft">{formatLempiras(all.earned)}</b></span>
            </div>
            <div className="income-chart"><small className="muted">Ganado por semana</small><WeekBars weeks={weeklyIncome(db.consultations, ref, 8)} /></div>
          </section>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Fecha</th><th>Cliente</th><th>Estado</th><th className="num">Importe</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>{formatShort(c.date)}</td>
                    <td><b>{db.clients.find((x) => x.id === c.clientId)?.name}</b><small className="muted">{c.mode}</small></td>
                    <td><ConsultChip status={c.status} /></td>
                    <td className="num"><b>{formatLempiras(c.price)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
