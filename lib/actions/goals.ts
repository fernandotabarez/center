'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Goal, WeeklyObjective, WeeklyObjectiveWithGoal } from '@/types'
import { format, startOfWeek } from 'date-fns'

// ===== GOALS =====

export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('completed', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })

  return data ?? []
}

export async function getActiveGoals(): Promise<Goal[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('archived', false)
    .eq('completed', false)
    .order('horizon')

  return data ?? []
}

export async function createGoal(
  data: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'completed' | 'completed_at' | 'archived' | 'current_value'>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('goals').insert({ ...data, user_id: user.id })
  revalidatePath('/objetivos')
  revalidatePath('/dashboard')
}

export async function updateGoalProgress(id: string, current_value: number) {
  const supabase = await createClient()
  const { data: goal } = await supabase.from('goals').select('target_value').eq('id', id).single()

  const updates: Partial<Goal> = { current_value }
  // Auto-completar si llegó al target
  if (goal?.target_value && current_value >= goal.target_value) {
    updates.completed = true
    updates.completed_at = new Date().toISOString()
  }

  await supabase.from('goals').update(updates).eq('id', id)
  revalidatePath('/objetivos')
  revalidatePath('/dashboard')
}

export async function toggleGoalCompleted(id: string, completed: boolean) {
  const supabase = await createClient()
  await supabase.from('goals').update({
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }).eq('id', id)
  revalidatePath('/objetivos')
  revalidatePath('/dashboard')
}

export async function archiveGoal(id: string) {
  const supabase = await createClient()
  await supabase.from('goals').update({ archived: true }).eq('id', id)
  revalidatePath('/objetivos')
}

// ===== WEEKLY OBJECTIVES =====

function getCurrentWeekStart(): string {
  // Lunes como inicio de semana
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export async function getCurrentWeekObjectives(): Promise<WeeklyObjectiveWithGoal[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const weekStart = getCurrentWeekStart()

  const { data } = await supabase
    .from('weekly_objectives')
    .select('*, goal:goals(*)')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .order('order_index')

  return (data as WeeklyObjectiveWithGoal[]) ?? []
}

export async function getPreviousWeekObjectives(): Promise<WeeklyObjectiveWithGoal[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const lastMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
  lastMonday.setDate(lastMonday.getDate() - 7)
  const weekStart = format(lastMonday, 'yyyy-MM-dd')

  const { data } = await supabase
    .from('weekly_objectives')
    .select('*, goal:goals(*)')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .order('order_index')

  return (data as WeeklyObjectiveWithGoal[]) ?? []
}

export async function createWeeklyObjectives(
  objectives: Array<{
    title: string
    goal_id: string | null
    contributes_amount: number | null
  }>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const weekStart = getCurrentWeekStart()

  // Borrar los existentes de esta semana (rehacer planificación)
  await supabase
    .from('weekly_objectives')
    .delete()
    .eq('user_id', user.id)
    .eq('week_start', weekStart)

  // Insertar nuevos
  const rows = objectives.map((o, idx) => ({
    user_id: user.id,
    week_start: weekStart,
    title: o.title,
    goal_id: o.goal_id,
    contributes_amount: o.contributes_amount,
    order_index: idx,
  }))

  if (rows.length) await supabase.from('weekly_objectives').insert(rows)
  revalidatePath('/objetivos')
  revalidatePath('/dashboard')
}

export async function toggleWeeklyObjective(id: string, completed: boolean) {
  const supabase = await createClient()
  const { data: obj } = await supabase
    .from('weekly_objectives')
    .select('*')
    .eq('id', id)
    .single()

  if (!obj) return

  await supabase.from('weekly_objectives').update({
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }).eq('id', id)

  // Si está linkeado a un goal numeric y tiene contributes_amount, actualizar progreso
  if (obj.goal_id && obj.contributes_amount) {
    const { data: goal } = await supabase
      .from('goals')
      .select('current_value, target_value, goal_type')
      .eq('id', obj.goal_id)
      .single()

    if (goal?.goal_type === 'numeric') {
      const delta = completed ? obj.contributes_amount : -obj.contributes_amount
      const newValue = Math.max(0, (goal.current_value ?? 0) + delta)
      await updateGoalProgress(obj.goal_id, newValue)
    }
  }

  revalidatePath('/objetivos')
  revalidatePath('/dashboard')
}