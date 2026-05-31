import { getSettings } from '@/lib/actions/settings'
import NotificacionesClient from '@/components/ajustes/notificaciones-client'

export default async function NotificacionesPage() {
  const settings = await getSettings()
  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <h1 className="text-xl font-medium text-gray-900 mb-1">Notificaciones</h1>
      <p className="text-sm text-gray-500 mb-5">Configurá cuándo y cómo te avisamos</p>
      <NotificacionesClient
        initialSettings={settings!}
        vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!}
      />
    </div>
  )
}
