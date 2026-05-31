'use client'

import { useState, useTransition } from 'react'
import { toggleHabitToday } from '@/lib/actions/habits'
import { HabitWithStreak } from '@/types'
import { Check, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HabitCheckList({ habits }: { habits: HabitWithStreak[] }) {
  const [pending, startTransition] = useTransition()
  const [localDone, setLocalDone] = useState<Record<string, boolean>>(
    Object.fromEntries(habits.map(h => [h.id, h.done_today]))
  )

  if (!habits.length) {
    return <p className="text-sm text-gray-400 py-2">No hay hábitos para hoy. <a href="/habitos" className="underline">Agregar uno.</a></p>
  }

  function toggle(id: string) {
    const next = !localDone[id]
    setLocalDone(p => ({ ...p, [id]: next }))
    startTransition(() => toggleHabitToday(id, next))
  }

  return (
    <ul className="space-y-0.5">
      {habits.map(h => (
        <li key={h.id} className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 last:border-0">
          <button
            onClick={() => toggle(h.id)}
            disabled={pending}
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
              localDone[h.id]
                ? 'bg-teal-400 border-teal-400'
                : 'border-gray-300 hover:border-teal-400'
            )}
          >
            {localDone[h.id] && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
          </button>
          <span className={cn('text-sm flex-1', localDone[h.id] ? 'line-through text-gray-400' : 'text-gray-800')}>
            {h.name}
          </span>
          {h.streak > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full">
              <Flame className="w-3 h-3" />{h.streak}d
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
