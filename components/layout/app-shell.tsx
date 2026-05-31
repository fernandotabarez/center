'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Repeat, Columns, Receipt, BarChart2, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',    label: 'inicio',   Icon: Home },
  { href: '/habitos',      label: 'hábitos',  Icon: Repeat },
  { href: '/tareas',       label: 'tareas',   Icon: Columns },
  { href: '/pagos',        label: 'pagos',    Icon: Receipt },
  { href: '/estadisticas', label: 'stats',    Icon: BarChart2 },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — solo desktop (md+) */}
      <aside className="hidden md:flex flex-col w-52 border-r border-gray-200 bg-gray-50 shrink-0">
        <div className="px-4 pt-5 pb-6 flex items-center gap-2">
          <div className="w-7 h-7 bg-teal-400 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-gray-900">Mi Centro</span>
        </div>

        <nav className="flex-1 px-2">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors',
                pathname === href
                  ? 'bg-white text-teal-600 font-medium shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-2 pb-4 border-t border-gray-200 pt-3 mt-2">
          <Link href="/ajustes" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors">
            <Settings className="w-4 h-4" /> ajustes
          </Link>
          <button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-white hover:text-gray-900 transition-colors">
            <LogOut className="w-4 h-4" /> salir
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>

        {/* Bottom nav — solo mobile */}
        <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 safe-bottom z-50">
          <div className="flex">
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                    active ? 'text-teal-600' : 'text-gray-400'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </main>
    </div>
  )
}
