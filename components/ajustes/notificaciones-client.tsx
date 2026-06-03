'use client'

import { useState, useTransition } from 'react'
import { updateSettings, savePushSubscription, sendTestPush } from '@/lib/actions/settings'
import { UserSettings } from '@/types'
import { Bell, Mail, Check, Smartphone } from 'lucide-react'

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-40 ${on ? 'bg-teal-400' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}

function Row({ icon, title, sub, right }: { icon: React.ReactNode; title: string; sub: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      {right}
    </div>
  )
}

export default function NotificacionesClient({ initialSettings, vapidKey }: {
  initialSettings: UserSettings
  vapidKey: string
}) {
  const [s, setS] = useState(initialSettings)
  const [saved, setSaved] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [testError, setTestError] = useState('')
  const [pending, startTransition] = useTransition()

  async function testPush() {
    setTestStatus('sending')
    setTestError('')
    const res = await sendTestPush()
    if (res.ok) {
      setTestStatus('ok')
      setTimeout(() => setTestStatus('idle'), 4000)
    } else {
      setTestStatus('error')
      setTestError(res.error ?? 'error desconocido')
    }
  }

  function update(patch: Partial<UserSettings>) {
    setS(p => ({ ...p, ...patch }))
  }

  async function enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Tu navegador no soporta notificaciones push. Usá Chrome o Edge.')
      return
    }
    setPushLoading(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { alert('Permiso denegado. Habilitalo desde la configuración del navegador.'); return }

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      await savePushSubscription(JSON.stringify(sub))
      update({ notif_push: true })
    } catch (e) {
      console.error(e)
      alert('Error activando push. Revisá la consola.')
    } finally {
      setPushLoading(false)
    }
  }

  function save() {
    startTransition(async () => {
      await updateSettings(s)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      {/* Preview de push */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">ejemplo de notificación</p>
        <div className="bg-white border border-gray-200 rounded-xl p-3 flex gap-2.5">
          <div className="w-8 h-8 bg-teal-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">MC</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">Resumen del día</p>
            <p className="text-xs text-gray-500 mt-0.5">3/5 hábitos · 2 tareas urgentes · UTE vence mañana</p>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">Abrir app</span>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Descartar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración push */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">push (navegador / móvil)</p>

        <Row
          icon={<Smartphone className="w-4 h-4" />}
          title="Notificaciones push"
          sub={s.notif_push ? 'activas en este dispositivo' : 'requiere permiso del navegador'}
          right={
            s.notif_push
              ? <Toggle on={true} onChange={v => update({ notif_push: v })} />
              : <button onClick={enablePush} disabled={pushLoading}
                  className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50">
                  {pushLoading ? 'activando...' : 'activar'}
                </button>
          }
        />

        {s.notif_push && (
          <>
            <Row
              icon={<Bell className="w-4 h-4" />}
              title="Resumen diario"
              sub="cada mañana al despertar"
              right={<Toggle on={true} onChange={() => {}} />}
            />
            <Row
              icon={<Bell className="w-4 h-4" />}
              title="Hábitos — recordatorio"
              sub="según el horario de cada hábito"
              right={<Toggle on={true} onChange={() => {}} />}
            />
            <Row
              icon={<Bell className="w-4 h-4" />}
              title="Tareas urgentes"
              sub="cuando vence en menos de 24h"
              right={<Toggle on={true} onChange={() => {}} />}
            />
            <Row
              icon={<Bell className="w-4 h-4" />}
              title="Vencimientos de pago"
              sub="X días antes (configurado por pago)"
              right={<Toggle on={true} onChange={() => {}} />}
            />
            <button
              onClick={testPush}
              disabled={testStatus === 'sending'}
              className="w-full mt-3 text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {testStatus === 'sending' ? 'Enviando...'
                : testStatus === 'ok' ? <><Check className="w-4 h-4 text-teal-600" /> Enviada — revisá la notificación</>
                : testStatus === 'error' ? 'Reintentar'
                : <><Bell className="w-4 h-4" /> Probar push</>}
            </button>
            {testStatus === 'error' && testError && (
              <p className="mt-2 text-xs text-red-600 break-words bg-red-50 rounded-lg p-2">{testError}</p>
            )}
          </>
        )}
      </div>

      {/* Email */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">email</p>
        <Row
          icon={<Mail className="w-4 h-4" />}
          title="Resumen diario por email"
          sub={`cada día a las ${s.daily_summary_time}`}
          right={<Toggle on={s.notif_email} onChange={v => update({ notif_email: v })} />}
        />
        {s.notif_email && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <label className="text-xs text-gray-500 mb-1 block">Hora de envío</label>
            <input
              type="time"
              value={s.daily_summary_time}
              onChange={e => update({ daily_summary_time: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        )}
      </div>

      <button
        onClick={save}
        disabled={pending}
        className="w-full bg-teal-400 hover:bg-teal-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {saved ? <><Check className="w-4 h-4" /> Guardado</> : pending ? 'Guardando...' : 'Guardar preferencias'}
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
