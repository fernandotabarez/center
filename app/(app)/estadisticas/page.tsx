import { createClient } from '@/lib/supabase/server'
import { getHabitsWithStats } from '@/lib/actions/habits'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import HeatmapClient from '@/components/estadisticas/heatmap-client'

export default async function EstadisticasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const habits = await getHabitsWithStats()

  // Logs de los últimos 90 días
  const from = format(subDays(new Date(), 90), 'yyyy-MM-dd')
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('date, done, habit_id')
    .eq('user_id', user!.id)
    .gte('date', from)
    .eq('done', true)

  // Agrupar por fecha
  const logsByDate: Record<string, number> = {}
  logs?.forEach(l => { logsByDate[l.date] = (logsByDate[l.date] ?? 0) + 1 })

  const totalDone = logs?.length ?? 0
  const bestStreak = Math.max(...habits.map(h => h.streak), 0)
  const avgConsistency = habits.length
    ? Math.round(habits.reduce((a, h) => a + h.consistency_30d, 0) / habits.length)
    : 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="mb-5">
        <h1 className="text-xl font-medium text-gray-900">Estadísticas</h1>
        <p className="text-sm text-gray-500">últimos 90 días</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'checks totales', value: totalDone },
          { label: 'racha más larga', value: `${bestStreak}d` },
          { label: 'consistencia promedio', value: `${avgConsistency}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-3.5">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-medium text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <p className="text-sm font-medium text-gray-900 mb-3">Actividad — últimos 90 días</p>
        <HeatmapClient logsByDate={logsByDate} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-medium text-gray-900 mb-3">Por hábito</p>
        <div className="space-y-3">
          {habits.map(h => (
            <div key={h.id} className="flex items-center gap-3">
              <span className="text-base">{h.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-800">{h.name}</span>
                  <span className="text-xs text-teal-600">{h.consistency_30d}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${Math.min(h.consistency_30d, 100)}%` }} />
                </div>
              </div>
              <div className="text-xs text-gray-400 w-12 text-right">🔥 {h.streak}d</div>
            </div>
          ))}
          {!habits.length && <p className="text-sm text-gray-400">Sin hábitos todavía.</p>}
        </div>
      </div>
    </div>
  )
}
