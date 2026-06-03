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

  // push_subscription lo gestionan savePushSubscription/disablePush.
  // Nunca lo pisamos acá: el `data` del cliente suele traerlo null y borraría la suscripción.
  const { push_subscription, ...rest } = data
  await supabase.from('user_settings').upsert({ ...rest, user_id: user.id })
  revalidatePath('/ajustes')
}

export async function disablePush() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('user_settings').upsert({
    user_id: user.id,
    notif_push: false,
    push_subscription: null,
  })
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
  if (!user) return { ok: false, error: 'Sin sesión' }

  // Validar config VAPID server-side
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return { ok: false, error: 'Faltan VAPID keys en el server' }
  }

  const { data } = await supabase
    .from('user_settings')
    .select('push_subscription')
    .eq('user_id', user.id)
    .single()

  if (!data?.push_subscription) {
    return { ok: false, error: 'No hay suscripción guardada — reactivá el push' }
  }

  try {
    const res = await sendPushNotification(JSON.parse(data.push_subscription), {
      title: 'Push de prueba ✅',
      body: 'Si ves esto, las notificaciones funcionan.',
      url: '/dashboard',
    })
    if (res.ok) return { ok: true }
    // Surface web-push detail (statusCode + body) para diagnóstico
    const err = res.err as { statusCode?: number; body?: string; message?: string } | undefined
    const detail = err?.statusCode
      ? `HTTP ${err.statusCode}: ${(err.body || err.message || '').toString().slice(0, 120)}`
      : (err?.message || 'fallo desconocido').toString().slice(0, 140)
    return { ok: false, error: detail }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `excepción: ${msg.slice(0, 140)}` }
  }
}
