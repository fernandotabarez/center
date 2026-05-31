import { Payment } from '@/types'
import { formatCurrency, formatDate, getDueSeverity } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ICONS: Record<string, string> = {
  ute: '⚡', antel: '📡', internet: '🌐', alquiler: '🏠',
  tarjeta: '💳', visa: '💳', mastercard: '💳', gym: '🏋️', agua: '💧',
}
function getIcon(name: string) {
  const key = Object.keys(ICONS).find(k => name.toLowerCase().includes(k))
  return key ? ICONS[key] : '📋'
}

const dueBadge: Record<string, string> = {
  overdue:  'text-red-600 font-medium',
  today:    'text-red-500 font-medium',
  tomorrow: 'text-amber-600 font-medium',
  soon:     'text-amber-500',
  ok:       'text-gray-400',
}

export default function PaymentList({ payments }: { payments: Payment[] }) {
  if (!payments.length) {
    return <p className="text-sm text-gray-400 py-2">Sin pagos próximos.</p>
  }

  return (
    <ul className="space-y-0.5">
      {payments.map(p => {
        const sev = getDueSeverity(p.due_date)
        return (
          <li key={p.id} className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 last:border-0">
            <span className="text-base">{getIcon(p.name)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-400">{p.recurrence === 'monthly' ? 'mensual' : p.recurrence}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{formatCurrency(p.amount, p.currency)}</p>
              <p className={cn('text-xs', dueBadge[sev])}>{formatDate(p.due_date)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
