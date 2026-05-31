import { Task } from '@/types'
import { cn, CATEGORY_COLORS } from '@/lib/utils'

const COLS: { key: Task['status']; label: string }[] = [
  { key: 'backlog',     label: 'backlog' },
  { key: 'in_progress',label: 'progreso' },
  { key: 'done',        label: 'listo' },
]

export default function KanbanMini({ tasks }: { tasks: Task[] }) {
  const byStatus = (s: string) => tasks.filter(t => t.status === s).slice(0, 3)

  return (
    <div className="grid grid-cols-3 gap-2">
      {COLS.map(({ key, label }) => (
        <div key={key} className="bg-gray-50 rounded-xl p-2">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">{label}</p>
          {byStatus(key).map(t => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-1.5 mb-1.5 last:mb-0">
              <p className="text-[11px] font-medium text-gray-800 leading-tight line-clamp-2">{t.title}</p>
              <span className={cn('text-[9px] px-1.5 py-0.5 rounded mt-1 inline-block', CATEGORY_COLORS[t.category])}>
                {t.category}
              </span>
            </div>
          ))}
          {byStatus(key).length === 0 && (
            <p className="text-[10px] text-gray-300 text-center py-2">vacío</p>
          )}
        </div>
      ))}
    </div>
  )
}
