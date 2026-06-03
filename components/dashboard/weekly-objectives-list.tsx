'use client'

import { useState, useTransition } from 'react'
import { toggleWeeklyObjective } from '@/lib/actions/goals'
import { WeeklyObjectiveWithGoal } from '@/types'
import { Check, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function WeeklyObjectivesList({ objectives }: { objectives: WeeklyObjectiveWithGoal[] }) {
  const [pending, startTransition] = useTransition()
  const [localDone, setLocalDone] = useState<Record<string, boolean>>(
    Object.fromEntries(objectives.map(o => [o.id, o.completed]))
  )

  if (!objectives.length) {
    return <p className="text-sm text-gray-400 py-2">No hay metas para esta semana. <a href="/objetivos" className="underline">Planificar la semana.</a></p>
  }

  function toggle(id: string) {
    const next = !localDone[id]
    setLocalDone(p => ({ ...p, [id]: next }))
    startTransition(() => toggleWeeklyObjective(id, next))
  }

  return (
    <ul className="space-y-0.5">
      {objectives.map(o => (
        <li key={o.id} className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 last:border-0">
          <button
            onClick={() => toggle(o.id)}
            disabled={pending}
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
              localDone[o.id]
                ? 'bg-teal-400 border-teal-400'
                : 'border-gray-300 hover:border-teal-400'
            )}
          >
            {localDone[o.id] && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
          </button>
          <span className={cn('text-sm flex-1', localDone[o.id] ? 'line-through text-gray-400' : 'text-gray-800')}>
            {o.title}
          </span>
          {o.goal && (
            <span className="flex items-center gap-0.5 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full max-w-[40%] truncate">
              <Target className="w-3 h-3 flex-shrink-0" />{o.goal.title}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
