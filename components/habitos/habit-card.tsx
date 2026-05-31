'use client'

import { useState, useTransition } from 'react'
import { toggleHabitToday, archiveHabit } from '@/lib/actions/habits'
import { HabitWithStreak } from '@/types'
import { Check, Flame, Archive, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const FREQ_LABEL: Record<string, string> = { daily: 'diario', weekly: 'semanal', monthly: 'mensual' }

export default function HabitCard({ habit }: { habit: HabitWithStreak }) {
  const [done, setDone] = useState(habit.done_today)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = !done
    setDone(next)
    startTransition(() => toggleHabitToday(habit.id, next))
  }

  function archive() {
    startTransition(() => archiveHabit(habit.id))
  }

  const pct = Math.min(habit.consistency_30d, 100)
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 relative">
      {/* Anillo de consistencia */}
      <div className="relative flex-shrink-0 w-12 h-12">
        <svg width="48" height="48" className="rotate-[-90deg]">
          <circle cx="24" cy="24" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="3" />
          <circle cx="24" cy="24" r={radius} fill="none" stroke="#1D9E75" strokeWidth="3"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg">
          {habit.icon}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', done ? 'line-through text-gray-400' : 'text-gray-900')}>{habit.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{FREQ_LABEL[habit.frequency]}</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-teal-600">{pct}% consistencia</span>
        </div>
      </div>

      {/* Racha */}
      {habit.streak > 0 && (
        <div className="flex items-center gap-0.5 text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded-full">
          <Flame className="w-3 h-3" /> {habit.streak}d
        </div>
      )}

      {/* Check */}
      <button
        onClick={toggle}
        disabled={pending}
        className={cn(
          'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
          done ? 'bg-teal-400 border-teal-400' : 'border-gray-300 hover:border-teal-400'
        )}
      >
        {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </button>

      {/* Menú */}
      <div className="relative">
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-300 hover:text-gray-500 p-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 w-32">
            <button onClick={archive} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
              <Archive className="w-3.5 h-3.5" /> Archivar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
