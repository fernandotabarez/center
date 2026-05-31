import { getHabitsWithStats } from '@/lib/actions/habits'
import HabitCard from '@/components/habitos/habit-card'
import NewHabitModal from '@/components/habitos/new-habit-modal'
import { Plus } from 'lucide-react'

export default async function HabitosPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const sp = await searchParams
  const habits = await getHabitsWithStats()

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Hábitos</h1>
          <p className="text-sm text-gray-500">{habits.length} activos</p>
        </div>
        <NewHabitModal autoOpen={sp?.new === '1'} />
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-2">Todavía no tenés hábitos.</p>
          <p className="text-sm">Creá el primero con el botón +</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(h => <HabitCard key={h.id} habit={h} />)}
        </div>
      )}
    </div>
  )
}
