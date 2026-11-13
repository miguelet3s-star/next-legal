import { ArrowUUpLeft, CreditCard, Receipt } from '@phosphor-icons/react'
import { getLawyer } from '../data/mock'
import { EmptyState, PageHead } from '../components/ui'
import { CountMoney, Guilloche } from '../components/visual'
import { useApp } from '../lib/app'
import { netPaid } from '../lib/db'
import { formatShort } from '../lib/dates'
import { formatLempiras } from '../lib/money'

export default function Pagos() {
  const { db } = useApp()
  const moves = [...db.payments].sort((a, b) => b.date.localeCompare(a.date) || (a.kind === 'reembolso' ? -1 : 1))

  return (
    <div className="page narrow">
      <PageHead title="Pagos" sub="Cada cobro y cada devolución, con su detalle." />
      {moves.length === 0 ? <EmptyState icon={CreditCard} title="Aún no tiene pagos" text="Cuando agende una consulta, el recibo aparecerá aquí." /> : (
        <>
          <section className="pay-card">
            <Guilloche />
            <span><small>Total pagado</small><CountMoney cents={netPaid(db.payments)} /></span>
            <span className="pay-card-foot"><span className="visa">VISA</span><span>terminada en 4242</span><small>{moves.length} movimientos</small></span>
          </section>
          <ul className="move-list stagger">
            {moves.map((p) => {
              const refund = p.kind === 'reembolso'
              return (
                <li key={p.id} className="move">
                  <span className={`round-ic ${refund ? 'green' : ''}`}>{refund ? <ArrowUUpLeft size={22} weight="bold" /> : <Receipt size={22} />}</span>
                  <div className="move-body">
                    <b>{refund ? 'Devolución de consulta' : 'Consulta'} con {getLawyer(p.lawyerId)?.name}</b>
                    <small className="muted">{formatShort(p.date)} · {p.method}</small>
                    <small className="muted">Consulta {formatLempiras(p.consultation)} + servicio {formatLempiras(p.fee)}</small>
                  </div>
                  <b className={`move-amount ${refund ? 'green' : ''}`}>{refund ? '+' : ''}{formatLempiras(p.total)}</b>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
