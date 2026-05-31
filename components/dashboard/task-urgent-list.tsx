import { Task } from '@/types'
import { formatDate, getDueSeverity } from '@/lib/utils'
import { cn } from '@/lib/utils'

const severityBadge: Record<string, string> = {
  overdue: 'bg-red-50 text-red-700',
  today:   'bg-red-50 text-red-700',
  tomorrow:'bg-amber-50 text-amber-700',
  soon:    'bg-gray-100 text-gray-600',
  ok:      'bg-gray-100 text-gray-500',
}
const priorityDot: Record<string, string> = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
}

export default function TaskUrgentList({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) {
    return <p className="text-sm text-gray-400 py-2">Sin tareas urgentes. ¡Buen trabajo!</p>
  }

  return (
    <ul className="space-y-0.5">
      {tasks.map(t => {
        const sev = t.due_date ? getDueSeverity(t.due_date) : 'ok'
        return (
          <li key={t.id} className="flex items-start gap-2.5 py-1.5 border-b border-gray-100 last:border-0">
            <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', priorityDot[t.priority])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{t.title}</p>
              <p className="text-xs text-gray-400">{t.category}</p>
            </div>
            {t.due_date && (
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap', severityBadge[sev])}>
                {formatDate(t.due_date)}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
