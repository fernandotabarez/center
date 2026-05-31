'use client'

import { useState, useTransition } from 'react'
import { Task } from '@/types'
import { updateTaskStatus, deleteTask } from '@/lib/actions/tasks'
import { formatDate, CATEGORY_COLORS, getDueSeverity } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Trash2, ArrowRight } from 'lucide-react'

const COLS: { key: Task['status']; label: string; color: string }[] = [
  { key: 'backlog',     label: 'backlog',    color: 'bg-gray-100' },
  { key: 'today',       label: 'hoy',        color: 'bg-amber-50' },
  { key: 'in_progress', label: 'en progreso',color: 'bg-blue-50' },
  { key: 'done',        label: 'listo',      color: 'bg-teal-50' },
]

const NEXT_STATUS: Record<string, Task['status']> = {
  backlog: 'today', today: 'in_progress', in_progress: 'done', done: 'backlog',
}
const NEXT_LABEL: Record<string, string> = {
  backlog: 'Mover a hoy', today: 'En progreso', in_progress: 'Listo', done: 'Volver a backlog',
}

const dueBadge: Record<string, string> = {
  overdue: 'bg-red-50 text-red-700', today: 'bg-red-50 text-red-700',
  tomorrow: 'bg-amber-50 text-amber-700', soon: 'bg-gray-100 text-gray-500', ok: 'bg-gray-100 text-gray-400',
}
const priorityBorder: Record<string, string> = {
  high: 'border-l-red-400', medium: 'border-l-amber-400', low: 'border-l-gray-300',
}

export default function KanbanBoard({ initialTasks }: { initialTasks: Record<string, Task[]> }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeTab, setActiveTab] = useState<Task['status']>('today')
  const [pending, startTransition] = useTransition()

  function moveTask(task: Task, newStatus: Task['status']) {
    setTasks(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { next[k] = next[k].filter(t => t.id !== task.id) })
      next[newStatus] = [{ ...task, status: newStatus }, ...(next[newStatus] ?? [])]
      return next
    })
    startTransition(() => updateTaskStatus(task.id, newStatus))
  }

  function remove(task: Task) {
    setTasks(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { next[k] = next[k].filter(t => t.id !== task.id) })
      return next
    })
    startTransition(() => deleteTask(task.id))
  }

  function TaskCard({ task }: { task: Task }) {
    const sev = task.due_date ? getDueSeverity(task.due_date) : 'ok'
    return (
      <div className={cn('bg-white border border-gray-200 border-l-4 rounded-xl p-3 mb-2 last:mb-0', priorityBorder[task.priority])}>
        <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', CATEGORY_COLORS[task.category])}>
            {task.category}
          </span>
          {task.due_date && (
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', dueBadge[sev])}>
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {task.status !== 'done' && (
            <button onClick={() => moveTask(task, NEXT_STATUS[task.status])}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowRight className="w-3 h-3" /> {NEXT_LABEL[task.status]}
            </button>
          )}
          <button onClick={() => remove(task)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile: tabs */}
      <div className="md:hidden">
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4 gap-0.5">
          {COLS.map(c => (
            <button key={c.key} onClick={() => setActiveTab(c.key)}
              className={cn('flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors', activeTab === c.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
              {c.label}
              {(tasks[c.key]?.length ?? 0) > 0 && (
                <span className="ml-1 text-[9px] bg-gray-200 text-gray-600 px-1 rounded-full">{tasks[c.key].length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="min-h-32">
          {(tasks[activeTab] ?? []).map(t => <TaskCard key={t.id} task={t} />)}
          {!(tasks[activeTab]?.length) && (
            <p className="text-sm text-gray-400 text-center py-8">Vacío</p>
          )}
        </div>
      </div>

      {/* Desktop: columnas */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        {COLS.map(c => (
          <div key={c.key} className={cn('rounded-2xl p-3', c.color)}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.label}</p>
              <span className="text-xs text-gray-400">{tasks[c.key]?.length ?? 0}</span>
            </div>
            {(tasks[c.key] ?? []).map(t => <TaskCard key={t.id} task={t} />)}
            {!(tasks[c.key]?.length) && (
              <p className="text-xs text-gray-300 text-center py-4">vacío</p>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
