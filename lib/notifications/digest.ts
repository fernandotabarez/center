import { Task } from '@/types'

export interface TaskBuckets {
  overdue: Task[]
  today: Task[]
}

/**
 * Agrupa tareas accionables por urgencia. `today` es 'yyyy-MM-dd'.
 * - overdue: pendiente con due_date anterior a hoy
 * - today:   pendiente con due_date igual a hoy
 * Se excluyen: completadas, sin due_date, y futuras.
 */
export function buildTaskBuckets(tasks: Task[], today: string): TaskBuckets {
  const pending = tasks.filter(t => t.status !== 'done' && t.due_date)
  return {
    overdue: pending.filter(t => (t.due_date as string) < today),
    today: pending.filter(t => t.due_date === today),
  }
}

const MAX_TITLES = 4

/** Une títulos hasta `max`, con overflow "+N". Ej: "A, B, C, D +2" */
export function bucketTitles(tasks: Task[], max = MAX_TITLES): string {
  const shown = tasks.slice(0, max).map(t => t.title)
  const extra = tasks.length - shown.length
  return shown.join(', ') + (extra > 0 ? ` +${extra}` : '')
}
