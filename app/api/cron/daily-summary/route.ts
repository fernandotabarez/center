import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { sendPushNotification } from '@/lib/push'
import { buildTaskBuckets, bucketTitles } from '@/lib/notifications/digest'
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

  // Service role: el cron no tiene sesión de usuario, debe bypassar RLS
  const supabase = createAdminClient()

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

    const { overdue, today: todayTasks } = buildTaskBuckets(tasks ?? [], today)
    const nextPayment = payments?.[0]

    // --- Cuerpo del push (texto multilínea) ---
    const lines: string[] = [`${habitsDone}/${habitsTotal} hábitos`]
    if (overdue.length) lines.push(`🔴 Vencidas (${overdue.length}): ${bucketTitles(overdue)}`)
    if (todayTasks.length) lines.push(`🟡 Hoy (${todayTasks.length}): ${bucketTitles(todayTasks)}`)
    if (!overdue.length && !todayTasks.length) lines.push('✅ Sin tareas para hoy')
    if (nextPayment) lines.push(`💳 ${nextPayment.name} vence pronto`)
    const body = lines.join('\n')

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
        const taskBlock =
          overdue.length || todayTasks.length
            ? `
              ${overdue.length ? `<p style="margin:0 0 4px;color:#DC2626;font-size:14px;font-weight:600">🔴 Vencidas (${overdue.length})</p>
              <ul style="margin:0 0 12px;padding-left:18px;color:#7F1D1D;font-size:13px">${overdue.slice(0, 4).map(t => `<li>${t.title}</li>`).join('')}${overdue.length > 4 ? `<li>+${overdue.length - 4} más</li>` : ''}</ul>` : ''}
              ${todayTasks.length ? `<p style="margin:0 0 4px;color:#B45309;font-size:14px;font-weight:600">🟡 Para hoy (${todayTasks.length})</p>
              <ul style="margin:0 0 4px;padding-left:18px;color:#92400E;font-size:13px">${todayTasks.slice(0, 4).map(t => `<li>${t.title}</li>`).join('')}${todayTasks.length > 4 ? `<li>+${todayTasks.length - 4} más</li>` : ''}</ul>` : ''}
            `
            : `<p style="margin:0;color:#059669;font-size:14px">✅ Sin tareas para hoy</p>`

        await resend.emails.send({
          from: 'Mi Centro <resumen@tudominio.com>',
          to: user.email,
          subject: `Tu resumen diario — ${todayLabel}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#1D9E75;margin-bottom:8px">Buenos días</h2>
              <p style="color:#374151;margin-bottom:20px">${todayLabel}</p>
              <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:16px">
                <p style="margin:0 0 12px;font-size:15px;color:#111827">${habitsDone}/${habitsTotal} hábitos${nextPayment ? ` · ${nextPayment.name} vence pronto` : ''}</p>
                ${taskBlock}
              </div>
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
