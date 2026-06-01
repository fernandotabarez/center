'use client'

import { useState } from 'react'
import { createGoal } from '@/lib/actions/goals'
import { GoalHorizon, GoalType, GoalCategory } from '@/types'
import { X } from 'lucide-react'

const ICONS = ['🎯','📚','💰','🏃','✈️','💪','🧠','🏆','📈','🎓','💼','🏠','💍','🌱','🎨','🎵','✍️','🍎','🛌']
const HORIZONS: { value: GoalHorizon; label: string; sub: string }[] = [
  { value: 'short_term', label: 'Corto plazo', sub: '1-3 meses' },
  { value: 'mid_term',   label: 'Mediano plazo', sub: '3-12 meses' },
  { value: 'long_term',  label: 'Largo plazo', sub: 'más de un año' },
]
const CATEGORIES: { value: GoalCategory; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'salud', label: 'Salud' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'carrera', label: 'Carrera' },
  { value: 'educacion', label: 'Educación' },
  { value: 'otro', label: 'Otro' },
]

export default function NewGoalModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    icon: '🎯',
    horizon: 'mid_term' as GoalHorizon,
    goal_type: 'numeric' as GoalType,
    category: 'personal' as GoalCategory,
    target_value: '',
    unit: '',
    due_date: '',
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await createGoal({
      title: form.title,
      description: form.description || null,
      icon: form.icon,
      horizon: form.horizon,
      goal_type: form.goal_type,
      category: form.category,
      target_value: form.goal_type === 'numeric' ? Number(form.target_value) : null,
      unit: form.goal_type === 'numeric' ? form.unit || null : null,
      due_date: form.due_date || null,
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto safe-bottom">
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium text-gray-900">Nueva meta</p>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Título</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="ej. Leer 12 libros este año"
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
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border-2 transition-colors ${form.icon === ic ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Horizonte</label>
            <div className="space-y-1.5">
              {HORIZONS.map(h => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, horizon: h.value }))}
                  className={`w-full text-left px-3 py-2 rounded-xl border-2 transition-colors ${form.horizon === h.value ? 'border-teal-400 bg-teal-50' : 'border-gray-200'}`}
                >
                  <p className="text-sm font-medium text-gray-900">{h.label}</p>
                  <p className="text-xs text-gray-500">{h.sub}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Tipo de meta</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, goal_type: 'numeric' }))}
                className={`px-3 py-2 rounded-xl border-2 text-sm transition-colors ${form.goal_type === 'numeric' ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600'}`}
              >
                <p className="font-medium">Con número</p>
                <p className="text-[10px]">ej. 12 libros</p>
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, goal_type: 'milestone' }))}
                className={`px-3 py-2 rounded-xl border-2 text-sm transition-colors ${form.goal_type === 'milestone' ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600'}`}
              >
                <p className="font-medium">Hito</p>
                <p className="text-[10px]">hecho / no hecho</p>
              </button>
            </div>
          </div>

          {form.goal_type === 'numeric' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Meta</label>
                <input
                  type="number"
                  value={form.target_value}
                  onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))}
                  placeholder="12"
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Unidad</label>
                <input
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="libros"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Categoría</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as GoalCategory }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Fecha límite (opcional)</label>
            <input
              type="date"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !form.title}
            className="w-full bg-teal-400 hover:bg-teal-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Creando...' : 'Crear meta'}
          </button>
        </form>
      </div>
    </div>
  )
}