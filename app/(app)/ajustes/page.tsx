import { getSettings } from '@/lib/actions/settings'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/ajustes/settings-client'

export default async function AjustesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const settings = await getSettings()

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <h1 className="text-xl font-medium text-gray-900 mb-5">Ajustes</h1>
      <SettingsClient
        initialSettings={settings!}
        email={user?.email ?? ''}
        vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!}
      />
    </div>
  )
}
