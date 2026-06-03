'use client'

import { useState, useTransition } from 'react'
import { updateSettings, savePushSubscription, disablePush } from '@/lib/actions/settings'
import { UserSettings } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bell, Mail, LogOut, Check } from 'lucide-react'

function Toggle({ on, onChange }: { on: boolean, onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`relative w-10 h-5 rounded-full transition-colors ${on ? 'bg-teal-400' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${on ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}

export default function SettingsClient({ initialSettings, email, vapidKey }: {
  initialSettings: UserSettings, email: string, vapidKey: string
}) {
  const [s, setS] = useState(initialSettings)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  function update(patch: Partial<UserSettings>) {
    setS(p => ({ ...p, ...patch }))
  }

  async function save() {
    startTransition(async () => {
      await updateSettings(s)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  async function enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Tu browser no soporta notificaciones push.')
      return
    }
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') { alert('Permiso denegado.'); return }

    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
    const subStr = JSON.stringify(sub)
    await savePushSubscription(subStr)
    update({ notif_push: true, push_subscription: subStr })
    alert('Notificaciones push activadas.')
  }

  async function disable() {
    update({ notif_push: false, push_subscription: null })
    await disablePush()
  }

  const hasPush = s.notif_push && !!s.push_subscription

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">cuenta</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 font-medium">
            {email[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{email}</p>
            <p className="text-xs text-gray-400">magic link auth</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">preferencias</p>
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-gray-900">Zona horaria</p></div>
          <select value={s.timezone} onChange={e => update({ timezone: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="America/Montevideo">Montevideo (UTC-3)</option>
            <option value="America/Buenos_Aires">Buenos Aires (UTC-3)</option>
            <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
            <option value="America/New_York">New York (UTC-5)</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-900">Moneda principal</p>
          <select value={s.currency} onChange={e => update({ currency: e.target.value as UserSettings['currency'] })}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option>UYU</option><option>USD</option><option>EUR</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-900">Hora resumen diario</p>
          <input type="time" value={s.daily_summary_time}
            onChange={e => update({ daily_summary_time: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">notificaciones</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-900">Push (navegador)</p>
              <p className="text-xs text-gray-400">{hasPush ? 'activo' : s.notif_push ? 'sin suscripción — reactivá' : 'desactivado'}</p>
            </div>
          </div>
          {hasPush
            ? <Toggle on={true} onChange={() => disable()} />
            : <button onClick={enablePush} className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full hover:bg-teal-100 transition-colors">activar</button>
          }
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-900">Resumen por email</p>
              <p className="text-xs text-gray-400">diario a las {s.daily_summary_time}</p>
            </div>
          </div>
          <Toggle on={s.notif_email} onChange={v => update({ notif_email: v })} />
        </div>
      </div>

      <button onClick={save} disabled={pending}
        className="w-full bg-teal-400 hover:bg-teal-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
        {saved ? <><Check className="w-4 h-4" /> Guardado</> : pending ? 'Guardando...' : 'Guardar cambios'}
      </button>

      <button onClick={signOut}
        className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800 py-2 transition-colors">
        <LogOut className="w-4 h-4" /> Cerrar sesión
      </button>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from(Array.from(rawData).map(c => c.charCodeAt(0)))
}
