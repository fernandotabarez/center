import { getGoals, getCurrentWeekObjectives } from '@/lib/actions/goals'
import GoalsClient from '@/components/objetivos/goals-client'

export const dynamic = 'force-dynamic'

export default async function ObjetivosPage({ searchParams }: { searchParams: Promise<{ plan?: string, new?: string }> }) {
  const sp = await searchParams
  const [goals, weeklyObjectives] = await Promise.all([
    getGoals(),
    getCurrentWeekObjectives(),
  ])

  return (
    <GoalsClient
      initialGoals={goals}
      initialWeekly={weeklyObjectives}
      autoOpenPlan={sp?.plan === '1'}
      autoOpenNew={sp?.new === '1'}
    />
  )
}