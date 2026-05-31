import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { sendPushNotification } from '@/lib/push'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verificar que viene de Vercel Cron
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Obtener todos los usuarios con notificaciones activas
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .or('notif_push.eq.true,notif_email.eq.true')

  if (!settings?.length) return NextResponse.json({ sent: 0 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  let sent = 0

  for (const s of settings) {
    // Obtener datos del usuario
    const [{ data: habits }, { data: tasks }, { data: payments }] = await Promise.all([
      supabase.from('habits').select('id, name').eq('user_id', s.user_id).eq('archived', false),
      supabase.from('tasks').select('*').eq('user_id', s.user_id).neq('status', 'done'),
      supabase.from('payments').select('*').eq('user_id', s.user_id).eq('paid', false).lte('due_date', format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd')),
    ])

    const { data: todayLogs } = await supabase
      .from('habit_logs')
      .select('habit_id, done')
      .eq('user_id', s.user_id)
      .eq('date', today)

    const doneIds = new Set(todayLogs?.filter(l => l.done).map(l => l.habit_id))
    const habitsDone = habits?.filter(h => doneIds.has(h.id)).length ?? 0
    const habitsTotal = habits?.length ?? 0

    const urgentTasks = tasks?.filter(t => {
      if (!t.due_date) return false
      return t.due_date <= format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')
    }) ?? []

    const nextPayment = payments?.[0]

    const body = `${habitsDone}/${habitsTotal} hábitos · ${urgentTasks.length} tareas urgentes${nextPayment ? ` · ${nextPayment.name} vence pronto` : ''}`

    // Push
    if (s.notif_push && s.push_subscription) {
      try {
        const sub = JSON.parse(s.push_subscription)
        await sendPushNotification(sub, {
          title: `Resumen del día — ${todayLabel}`,
          body,
          url: '/dashboard',
        })
        sent++
      } catch (e) {
        console.error('push error user', s.user_id, e)
      }
    }

    // Email
    if (s.notif_email) {
      const { data: { user } } = await supabase.auth.admin.getUserById(s.user_id)
      if (user?.email) {
        await resend.emails.send({
          from: 'Mi Centro <resumen@tudominio.com>',
          to: user.email,
          subject: `Tu resumen diario — ${todayLabel}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#1D9E75;margin-bottom:8px">Buenos días</h2>
              <p style="color:#374151;margin-bottom:20px">${todayLabel}</p>
              <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:16px">
                <p style="margin:0;font-size:15px;color:#111827">${body}</p>
              </div>
              ${urgentTasks.length ? `<p style="color:#B45309;font-size:13px">Tareas urgentes: ${urgentTasks.map(t => t.title).join(', ')}</p>` : ''}
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;background:#1D9E75;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px">Ver dashboard</a>
            </div>
          `,
        })
        sent++
      }
    }
  }

  return NextResponse.json({ sent })
}
