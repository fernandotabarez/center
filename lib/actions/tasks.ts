'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Task } from '@/types'

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'done')
    .order('due_date', { ascending: true, nullsFirst: false })

  return data ?? []
}

export async function getTasksByStatus(): Promise<Record<string, Task[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const tasks = data ?? []
  return {
    backlog: tasks.filter(t => t.status === 'backlog'),
    today: tasks.filter(t => t.status === 'today'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done').slice(0, 10),
  }
}

export async function createTask(data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('tasks').insert({ ...data, user_id: user.id })
  revalidatePath('/tareas')
  revalidatePath('/dashboard')
}

export async function updateTaskStatus(id: string, status: Task['status']) {
  const supabase = await createClient()
  await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/tareas')
  revalidatePath('/dashboard')
}

export async function updateTask(id: string, data: Partial<Task>) {
  const supabase = await createClient()
  await supabase.from('tasks').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/tareas')
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  await supabase.from('tasks').delete().eq('id', id)
  revalidatePath('/tareas')
  revalidatePath('/dashboard')
}
