'use client'

import { useState } from 'react'
import { createWeeklyObjectives } from '@/lib/actions/goals'
import { Goal, WeeklyObjectiveWithGoal } from '@/types'
import { X, Plus, Trash2, Sparkles } from 'lucide-react'

interface DraftObjective {
  title: string
  goal_id: string | null
  contributes_amount: string
}

export default function WeeklyPlanWizard({
  existingObjectives,
  activeGoals,
  onClose,
}: {
  existingObjectives: WeeklyObjectiveWithGoal[]
  activeGoals: Goal[]
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [drafts, setDrafts] = useState<DraftObjective[]>(
    existingObjectives.length > 0
      ? existingObjectives.map(w => ({
          title: w.title,
          goal_id: w.goal_id,
          contributes_amount: w.contributes_amount?.toString() ?? '',
        }))
      : [{ title: '', goal_id: null, contributes_amount: '' }]
  )

  function updateDraft(i: number, patch: Partial<DraftObjective>) {
    setDrafts(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d))
  }
  function addDraft() {
    if (drafts.length < 5) setDrafts(prev => [...prev, { title: '', goal_id: null, contributes_amount: '' }])
  }
  function removeDraft(i: number) {
    setDrafts(prev => prev.filter((_, idx) => idx !== i))
  }

  async function submit() {
    setLoading(true)
    const validDrafts = drafts.filter(d => d.title.trim())
    await createWeeklyObjectives(
      validDrafts.map(d => ({
        title: d.title.trim(),
        goal_id: d.goal_id,
        contributes_amount: d.contributes_amount ? Number(d.contributes_amount) : null,
      }))
    )
    setLoading(false)
    onClose()
  }

  function getLinkedGoal(goalId: string | null): Goal | undefined {
    return goalId ? activeGoals.find(g => g.id === goalId) : undefined
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto safe-bottom">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-50 to-teal-50 p-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Planear semana</p>
              </div>
              <p className="font-medium text-gray-900 text-base">¿Qué querés lograr esta semana?</p>
              <p className="text-xs text-gray-600 mt-1">Definí entre 3 y 5 objetivos concretos</p>
            </div>
            <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
        </div>

        {/* Form */}
        <div className="p-5 space-y-3">
          {drafts.map((d, i) => {
            const linkedGoal = getLinkedGoal(d.goal_id)
            return (
              <div key={i} className="border border-gray-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400 w-5">{i + 1}.</span>
                  <input
                    value={d.title}
                    onChange={e => updateDraft(i, { title: e.target.value })}
                    placeholder="ej. Leer capítulo 6"
                    className="flex-1 px-2 py-1.5 border-b border-transparent focus:border-teal-400 text-sm outline-none"
                  />
                  {drafts.length > 1 && (
                    <button onClick={() => removeDraft(i)} className="text-gray-300 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {activeGoals.length > 0 && (
                  <div className="pl-7">
                    <label className="text-xs text-gray-500 mb-1 block">Contribuye a (opcional)</label>
                    <select
                      value={d.goal_id ?? ''}
                      onChange={e => updateDraft(i, { goal_id: e.target.value || null, contributes_amount: '' })}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">— sin meta vinculada —</option>
                      {activeGoals.map(g => (
                        <option key={g.id} value={g.id}>{g.icon} {g.title}</option>
                      ))}
                    </select>

                    {linkedGoal?.goal_type === 'numeric' && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">cuánto suma:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={d.contributes_amount}
                          onChange={e => updateDraft(i, { contributes_amount: e.target.value })}
                          placeholder="1"
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <span className="text-xs text-gray-500">{linkedGoal.unit ?? ''}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {drafts.length < 5 && (
            <button
              onClick={addDraft}
              className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar otro objetivo
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 sticky bottom-0 bg-white safe-bottom">
          <button
            onClick={submit}
            disabled={loading || !drafts.some(d => d.title.trim())}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Guardando...' : 'Empezar la semana'}
          </button>
        </div>
      </div>
    </div>
  )
}