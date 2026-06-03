'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/push'
import { UserSettings } from '@/types'

export async function getSettings(): Promise<UserSettings | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!data) {
    // Crear defaults
    const defaults: UserSettings = {
      user_id: user.id,
      timezone: 'America/Montevideo',
      currency: 'UYU',
      theme: 'system',
      notif_push: false,
      notif_email: false,
      daily_summary_time: '08:00',
      push_subscription: null,
    }
    await supabase.from('user_settings').insert(defaults)
    return defaults
  }

  return data
}

export async function updateSettings(data: Partial<UserSettings>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('user_settings').upsert({ ...data, user_id: user.id })
  revalidatePath('/ajustes')
}

export async function savePushSubscription(subscription: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('user_settings').upsert({
    user_id: user.id,
    push_subscription: subscription,
    notif_push: true,
  })
}

export async function sendTestPush(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'no-auth' }

  const { data } = await supabase
    .from('user_settings')
    .select('push_subscription')
    .eq('user_id', user.id)
    .single()

  if (!data?.push_subscription) return { ok: false, error: 'no-subscription' }

  try {
    const res = await sendPushNotification(JSON.parse(data.push_subscription), {
      title: 'Push de prueba ✅',
      body: 'Si ves esto, las notificaciones funcionan.',
      url: '/dashboard',
    })
    return res.ok ? { ok: true } : { ok: false, error: 'send-failed' }
  } catch {
    return { ok: false, error: 'send-failed' }
  }
}
