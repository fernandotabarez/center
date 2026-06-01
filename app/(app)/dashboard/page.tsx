import { createClient } from '@/lib/supabase/server'
import { getHabitsWithStats } from '@/lib/actions/habits'
import { getTasks } from '@/lib/actions/tasks'
import { getUpcomingPayments } from '@/lib/actions/payments'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import HabitCheckList from '@/components/dashboard/habit-check-list'
import TaskUrgentList from '@/components/dashboard/task-urgent-list'
import KanbanMini from '@/components/dashboard/kanban-mini'
import PaymentList from '@/components/dashboard/payment-list'
import { Bell, Plus } from 'lucide-react'
import Link from 'next/link'
import AddQuickModal from '@/components/dashboard/add-quick-modal'
import { getCurrentWeekObjectives } from '@/lib/actions/goals'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [habits, tasks, payments, weeklyObjs] = await Promise.all([
  getHabitsWithStats(),
  getTasks(),
  getUpcomingPayments(30),
  getCurrentWeekObjectives(),
])

  const today = format(new Date(), 'yyyy-MM-dd')
 const todayHabits = habits.filter(h => {
  if (h.frequency === 'daily') return true
  if (h.frequency === 'weekly') return h.days_of_week.includes(new Date().getDay())
  // weekly_flex: aparece mientras no se haya alcanzado la meta semanal
  if (h.frequency === 'weekly_flex') return h.week_progress.done < h.week_progress.target
  return false
})
  const doneToday = todayHabits.filter(h => h.done_today).length
  const streak = Math.max(...habits.map(h => h.streak), 0)
  const consistency = habits.length
    ? Math.round(habits.reduce((a, h) => a + h.consistency_30d, 0) / habits.length)
    : 0
  const urgentTasks = tasks.filter(t => {
    if (!t.due_date) return false
    const d = parseISO(t.due_date)
    return isToday(d) || isTomorrow(d)
  })

  const dayLabel = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  const userName = user?.email?.split('@')[0] ?? 'ahí'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="max-w-4xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-medium text-gray-900">{greeting}, {userName}</h1>
          <p className="text-sm text-gray-500 capitalize">{dayLabel}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/ajustes/notificaciones" className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors">
            <Bell className="w-4 h-4" />
          </Link>
          <AddQuickModal />
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'hábitos hoy', value: `${doneToday}/${todayHabits.length}`, color: doneToday === todayHabits.length ? 'text-teal-600' : 'text-gray-900' },
          { label: 'días de racha', value: String(streak), color: 'text-gray-900' },
          { label: 'tareas urgentes', value: String(urgentTasks.length), color: urgentTasks.length > 0 ? 'text-amber-600' : 'text-gray-900' },
          { label: 'consistencia mes', value: `${consistency}%`, color: 'text-gray-900' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-3.5">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-medium ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Fila principal */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900">Hábitos de hoy</h2>
            <Link href="/habitos" className="text-xs text-gray-400 hover:text-gray-600">ver todos →</Link>
          </div>
          <HabitCheckList habits={todayHabits} />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900">Tareas urgentes</h2>
            <Link href="/tareas" className="text-xs text-gray-400 hover:text-gray-600">kanban →</Link>
          </div>
          <TaskUrgentList tasks={urgentTasks.length ? urgentTasks : tasks.slice(0, 4)} />
        </div>
      </div>

      {/* Fila secundaria */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900">Kanban</h2>
            <Link href="/tareas" className="text-xs text-gray-400 hover:text-gray-600">expandir →</Link>
          </div>
          <KanbanMini tasks={tasks} />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900">Próximos pagos</h2>
            <Link href="/pagos" className="text-xs text-gray-400 hover:text-gray-600">ver todos →</Link>
          </div>
          <PaymentList payments={payments.slice(0, 4)} />
        </div>
      </div>
    </div>
  )
}
