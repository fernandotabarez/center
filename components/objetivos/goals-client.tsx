'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Goal, WeeklyObjectiveWithGoal } from '@/types'
import { toggleWeeklyObjective, toggleGoalCompleted, archiveGoal, updateGoalProgress } from '@/lib/actions/goals'
import { Plus, Target, Calendar, Check, Archive, MoreHorizontal, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import NewGoalModal from './new-goal-modal'
import WeeklyPlanWizard from './weekly-plan-wizard'

const HORIZON_LABEL: Record<string, string> = {
  short_term: 'corto plazo',
  mid_term: 'mediano plazo',
  long_term: 'largo plazo',
}
const HORIZON_COLORS: Record<string, string> = {
  short_term: 'bg-amber-50 text-amber-700',
  mid_term: 'bg-purple-50 text-purple-700',
  long_term: 'bg-teal-50 text-teal-700',
}
const CATEGORY_LABEL: Record<string, string> = {
  personal: 'personal', salud: 'salud', finanzas: 'finanzas',
  carrera: 'carrera', educacion: 'educación', otro: 'otro',
}

export default function GoalsClient({
  initialGoals,
  initialWeekly,
  autoOpenPlan,
  autoOpenNew,
}: {
  initialGoals: Goal[]
  initialWeekly: WeeklyObjectiveWithGoal[]
  autoOpenPlan?: boolean
  autoOpenNew?: boolean
}) {
  const router = useRouter()
  const [goals, setGoals] = useState(initialGoals)
  const [weekly, setWeekly] = useState(initialWeekly)
  const [tab, setTab] = useState<'semana' | 'metas'>('semana')
  const [showWizard, setShowWizard] = useState(autoOpenPlan ?? false)
  const [showNewGoal, setShowNewGoal] = useState(autoOpenNew ?? false)
  const [pending, startTransition] = useTransition()

  // Sincroniza datos frescos del server (tras router.refresh) en el estado local
  useEffect(() => { setGoals(initialGoals) }, [initialGoals])
  useEffect(() => { setWeekly(initialWeekly) }, [initialWeekly])

  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  function toggleWeekly(id: string) {
    setWeekly(prev => prev.map(w => w.id === id ? { ...w, completed: !w.completed } : w))
    const obj = weekly.find(w => w.id === id)
    if (obj) startTransition(() => toggleWeeklyObjective(id, !obj.completed))
  }

  const weeklyDone = weekly.filter(w => w.completed).length
  const weeklyTotal = weekly.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Objetivos</h1>
          <p className="text-sm text-gray-500">
            {activeGoals.length} metas activas · {weeklyDone}/{weeklyTotal} objetivos semanales
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-medium px-3 py-2 rounded-xl transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            Planear semana
          </button>
          <button
            onClick={() => setShowNewGoal(true)}
            className="w-9 h-9 rounded-xl bg-teal-400 flex items-center justify-center text-white hover:bg-teal-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5 gap-0.5">
        <button
          onClick={() => setTab('semana')}
          className={cn(
            'flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors',
            tab === 'semana' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          )}
        >
          Esta semana
        </button>
        <button
          onClick={() => setTab('metas')}
          className={cn(
            'flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors',
            tab === 'metas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          )}
        >
          Mis metas
        </button>
      </div>

      {/* SEMANA */}
      {tab === 'semana' && (
        <>
          {weekly.length === 0 ? (
            <div className="bg-gradient-to-br from-purple-50 to-teal-50 border border-purple-100 rounded-2xl p-8 text-center">
              <Calendar className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <p className="font-medium text-gray-900 mb-1">Sin plan para esta semana</p>
              <p className="text-sm text-gray-500 mb-4">
                Definí 3 a 5 cosas que querés lograr antes del domingo
              </p>
              <button
                onClick={() => setShowWizard(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                Planear esta semana
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {weekly.map(w => (
                <div key={w.id} className="bg-white border border-gray-200 rounded-2xl p-3.5 flex items-center gap-3">
                  <button
                    onClick={() => toggleWeekly(w.id)}
                    disabled={pending}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      w.completed ? 'bg-teal-400 border-teal-400' : 'border-gray-300 hover:border-teal-400'
                    )}
                  >
                    {w.completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', w.completed ? 'line-through text-gray-400' : 'text-gray-900 font-medium')}>
                      {w.title}
                    </p>
                    {w.goal && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs">{w.goal.icon}</span>
                        <span className="text-xs text-purple-600">{w.goal.title}</span>
                        {w.contributes_amount && (
                          <span className="text-xs text-gray-400">· +{w.contributes_amount} {w.goal.unit ?? ''}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowWizard(true)}
                className="w-full mt-3 py-2.5 text-xs text-gray-500 hover:text-gray-800 border border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-colors"
              >
                Re-planear esta semana
              </button>
            </div>
          )}
        </>
      )}

      {/* METAS */}
      {tab === 'metas' && (
        <>
          {activeGoals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Target className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="mb-2">Sin metas todavía.</p>
              <p className="text-sm">Creá la primera con el botón +</p>
            </div>
          ) : (
            <>
              {(['short_term','mid_term','long_term'] as const).map(horizon => {
                const groupGoals = activeGoals.filter(g => g.horizon === horizon)
                if (!groupGoals.length) return null
                return (
                  <div key={horizon} className="mb-5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                      {HORIZON_LABEL[horizon]}
                    </p>
                    <div className="space-y-2">
                      {groupGoals.map(g => <GoalCard key={g.id} goal={g} />)}
                    </div>
                  </div>
                )
              })}

              {completedGoals.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Completadas</p>
                  <div className="space-y-2">
                    {completedGoals.slice(0, 5).map(g => <GoalCard key={g.id} goal={g} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {showWizard && (
        <WeeklyPlanWizard
          existingObjectives={weekly}
          activeGoals={activeGoals}
          onClose={() => { setShowWizard(false); router.refresh() }}
        />
      )}
      {showNewGoal && <NewGoalModal onClose={() => { setShowNewGoal(false); router.refresh() }} />}
    </div>
  )
}

function GoalCard({ goal }: { goal: Goal }) {
  const [pending, startTransition] = useTransition()
  const [showProgress, setShowProgress] = useState(false)
  const [newValue, setNewValue] = useState(goal.current_value)

  const pct = goal.goal_type === 'numeric' && goal.target_value
    ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
    : goal.completed ? 100 : 0

  const daysLeft = goal.due_date ? differenceInDays(parseISO(goal.due_date), new Date()) : null

  return (
    <div className={cn('bg-white border border-gray-200 rounded-2xl p-3.5', goal.completed && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{goal.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className={cn('text-sm font-medium', goal.completed && 'line-through')}>{goal.title}</p>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', HORIZON_COLORS[goal.horizon])}>
              {HORIZON_LABEL[goal.horizon]}
            </span>
          </div>

          {goal.goal_type === 'numeric' && goal.target_value && (
            <p className="text-xs text-gray-500 mb-2">
              {goal.current_value} / {goal.target_value} {goal.unit ?? ''}
            </p>
          )}

          {goal.due_date && !goal.completed && (
            <p className="text-xs text-gray-400 mb-2">
              {daysLeft !== null && daysLeft >= 0
                ? `${daysLeft} días restantes`
                : `vencida hace ${Math.abs(daysLeft ?? 0)} días`}
            </p>
          )}

          {goal.goal_type === 'numeric' && (
            <>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-teal-600 font-medium">{pct}%</span>
                {!goal.completed && (
                  <button
                    onClick={() => setShowProgress(!showProgress)}
                    className="text-xs text-gray-400 hover:text-gray-700"
                  >
                    actualizar
                  </button>
                )}
              </div>
              {showProgress && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    value={newValue}
                    onChange={e => setNewValue(Number(e.target.value))}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      startTransition(() => updateGoalProgress(goal.id, newValue))
                      setShowProgress(false)
                    }}
                    disabled={pending}
                    className="bg-teal-400 hover:bg-teal-600 text-white text-xs px-3 rounded-lg"
                  >
                    Guardar
                  </button>
                </div>
              )}
            </>
          )}

          {goal.goal_type === 'milestone' && !goal.completed && (
            <button
              onClick={() => startTransition(() => toggleGoalCompleted(goal.id, true))}
              disabled={pending}
              className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-full transition-colors"
            >
              <Check className="w-3 h-3 inline mr-1" /> Marcar como cumplido
            </button>
          )}
        </div>
      </div>
    </div>
  )
}