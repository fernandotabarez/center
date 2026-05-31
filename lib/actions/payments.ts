'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Payment } from '@/types'
import { format, addMonths, addYears } from 'date-fns'

export async function getPayments(): Promise<Payment[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })

  return data ?? []
}

export async function getUpcomingPayments(days = 30): Promise<Payment[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const future = format(new Date(Date.now() + days * 86400000), 'yyyy-MM-dd')
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .eq('paid', false)
    .lte('due_date', future)
    .gte('due_date', today)
    .order('due_date')

  return data ?? []
}

export async function createPayment(data: Omit<Payment, 'id' | 'user_id' | 'created_at' | 'paid' | 'paid_at'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('payments').insert({ ...data, user_id: user.id, paid: false })
  revalidatePath('/pagos')
  revalidatePath('/dashboard')
}

export async function markPaymentPaid(id: string, recurrence: Payment['recurrence']) {
  const supabase = await createClient()
  const { data: payment } = await supabase.from('payments').select('*').eq('id', id).single()
  if (!payment) return

  await supabase.from('payments').update({ paid: true, paid_at: new Date().toISOString() }).eq('id', id)

  // Si es recurrente, crear el próximo vencimiento
  if (recurrence !== 'once') {
    const currentDue = new Date(payment.due_date)
    let nextDue: Date
    if (recurrence === 'monthly') nextDue = addMonths(currentDue, 1)
    else if (recurrence === 'bimonthly') nextDue = addMonths(currentDue, 2)
    else nextDue = addYears(currentDue, 1)

    await supabase.from('payments').insert({
      ...payment,
      id: undefined,
      due_date: format(nextDue, 'yyyy-MM-dd'),
      paid: false,
      paid_at: null,
      created_at: undefined,
    })
  }

  revalidatePath('/pagos')
  revalidatePath('/dashboard')
}

export async function deletePayment(id: string) {
  const supabase = await createClient()
  await supabase.from('payments').delete().eq('id', id)
  revalidatePath('/pagos')
}
