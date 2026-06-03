'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createHabit } from '@/lib/actions/habits'
import { getActiveGoals } from '@/lib/actions/goals'
import { Goal } from '@/types'
import { Plus, X } from 'lucide-react'

const ICONS = ['🏋️','💧','📚','🧘','🚶','🍎','💊','🎯','✍️','🌙','🏃','🎸','💰','🧹','📝']
const DAYS = ['L','M','X','J','V','S','D']

type Frequency = 'daily' | 'weekly' | 'weekly_flex' | 'monthly'

export default function NewHabitModal({ autoOpen = false }: { autoOpen?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(autoOpen)
  const [loading, setLoading] = useState(false)
  const [activeGoals, setActiveGoals] = useState<Goal[]>([])
  const [form, setForm] = useState({
    name: '',
    icon: '🎯',
    frequency: 'daily' as Frequency,
    days_of_week: [1, 2, 3, 4, 5] as number[],
    times_per_week: 3,
    notif_time: '08:00',
    color: '#1D9E75',
    linked_goal_id: null as string | null,
    contributes_amount: 1,
  })

  useEffect(() => {
    if (open) getActiveGoals().then(setActiveGoals)
  }, [open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await createHabit(form)
    router.refresh()
    setOpen(false)
    setLoading(false)
    setForm({
      name: '',
      icon: '🎯',
      frequency: 'daily',
      days_of_week: [1, 2, 3, 4, 5],
      times_per_week: 3,
      notif_time: '08:00',
      color: '#1D9E75',
      linked_goal_id: null,
      contributes_amount: 1,
    })
  }

  function toggleDay(d: number) {
    setForm(f => ({
      ...f,
      days_of_week: f.days_of_week.includes(d)
        ? f.days_of_week.filter(x => x !== d)
        : [...f.days_of_week, d],
    }))
  }

  const numericGoals = activeGoals.filter(g => g.goal_type === 'numeric')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-xl bg-teal-400 flex items-center justify-center text-white hover:bg-teal-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto safe-bottom">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium text-gray-900">Nuevo hábito</p>
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Nombre</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="ej. Gimnasio"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Ícono</label>
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border-2 transition-colors ${
                        form.icon === ic
                          ? 'border-teal-400 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Frecuencia</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm(f => ({ ...f, frequency: e.target.value as Frequency }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="daily">Todos los días</option>
                  <option value="weekly_flex">X veces por semana (flexible)</option>
                  <option value="weekly">Días específicos de la semana</option>
                  <option value="monthly">Una vez por mes</option>
                </select>
              </div>

              {form.frequency === 'weekly_flex' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">
                    ¿Cuántas veces por semana?
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, times_per_week: n }))}
                        className={`flex-1 h-10 rounded-lg text-sm font-medium border-2 transition-colors ${
                          form.times_per_week === n
                            ? 'bg-teal-400 text-white border-teal-400'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Marcalo el día que lo hagas, sin importar cuál de la semana.
                  </p>
                </div>
              )}

              {form.frequency === 'weekly' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Días</label>
                  <div className="flex gap-1.5">
                    {DAYS.map((d, i) => {
                      const dayValue = i === 6 ? 0 : i + 1
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDay(dayValue)}
                          className={`flex-1 h-9 rounded-lg text-xs font-medium border transition-colors ${
                            form.days_of_week.includes(dayValue)
                              ? 'bg-teal-400 text-white border-teal-400'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Hora de recordatorio
                </label>
                <input
                  type="time"
                  value={form.notif_time}
                  onChange={e => setForm(f => ({ ...f, notif_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {numericGoals.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Vincular a meta anual{' '}
                    <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <select
                    value={form.linked_goal_id ?? ''}
                    onChange={e =>
                      setForm(f => ({ ...f, linked_goal_id: e.target.value || null }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="">— sin meta vinculada —</option>
                    {numericGoals.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.icon} {g.title} ({g.current_value}/{g.target_value} {g.unit ?? ''})
                      </option>
                    ))}
                  </select>

                  {form.linked_goal_id && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">cada check suma:</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={form.contributes_amount}
                        onChange={e =>
                          setForm(f => ({ ...f, contributes_amount: Number(e.target.value) }))
                        }
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                      <span className="text-xs text-gray-500">
                        {numericGoals.find(g => g.id === form.linked_goal_id)?.unit ?? 'unidad'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !form.name}
                className="w-full bg-teal-400 hover:bg-teal-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {loading ? 'Guardando...' : 'Crear hábito'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}