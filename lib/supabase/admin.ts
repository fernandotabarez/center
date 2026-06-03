import { createClient } from '@supabase/supabase-js'

/**
 * Cliente con service_role: bypassa RLS y habilita auth.admin.
 * Solo para contextos server-to-server sin sesión de usuario (ej. cron).
 * NUNCA exponer al browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
