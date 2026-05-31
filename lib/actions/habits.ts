'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Habit, HabitWithStreak } from '@/types'
import { format } from 'date-fns'

export async function getHabitsWithStats(): Promise<HabitWithStreak[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = format(new Date(), 'yyyy-MM-dd')
  const thirtyDaysAgo = format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd')

  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('created_at')

  if (!habits?.length) return []

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', thirtyDaysAgo)

  return habits.map((habit: Habit) => {
    const habitLogs = logs?.filter(l => l.habit_id === habit.id) ?? []
    const todayLog = habitLogs.find(l => l.date === today)
    const done_today = todayLog?.done ?? false

    // Calcular racha
    let streak = 0
    const checkDate = new Date()
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd')
      const log = habitLogs.find(l => l.date === dateStr && l.done)
      if (!log) break
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Consistencia 30d
    const expectedDays = habit.frequency === 'daily' ? 30
      : habit.frequency === 'weekly' ? Math.floor(30 / 7) * habit.days_of_week.length
      : 1
    const doneLogs = habitLogs.filter(l => l.done).length
    const consistency_30d = expectedDays > 0 ? Math.round((doneLogs / expectedDays) * 100) : 0

    return { ...habit, streak, done_today, consistency_30d }
  })
}

export async function toggleHabitToday(habitId: string, done: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const today = format(new Date(), 'yyyy-MM-dd')

  await supabase.from('habit_logs').upsert(
    { habit_id: habitId, user_id: user.id, date: today, done },
    { onConflict: 'habit_id,date' }
  )

  revalidatePath('/dashboard')
  revalidatePath('/habitos')
}

export async function createHabit(data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'archived'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('habits').insert({ ...data, user_id: user.id, archived: false })
  revalidatePath('/habitos')
  revalidatePath('/dashboard')
}

export async function updateHabit(id: string, data: Partial<Habit>) {
  const supabase = await createClient()
  await supabase.from('habits').update(data).eq('id', id)
  revalidatePath('/habitos')
}

export async function archiveHabit(id: string) {
  const supabase = await createClient()
  await supabase.from('habits').update({ archived: true }).eq('id', id)
  revalidatePath('/habitos')
  revalidatePath('/dashboard')
}
