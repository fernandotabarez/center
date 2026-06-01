'use client'

import { useState } from 'react'
import { Plus, X, Repeat, CheckSquare, Receipt } from 'lucide-react'
import Link from 'next/link'

export default function AddQuickModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-xl bg-teal-400 flex items-center justify-center text-white hover:bg-teal-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
  <div className="bg-white rounded-t-2xl md:rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto safe-bottom">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium text-gray-900">Agregar rápido</p>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { href: '/habitos?new=1', Icon: Repeat,      label: 'Hábito',  color: 'bg-purple-50 text-purple-600' },
                { href: '/tareas?new=1',  Icon: CheckSquare, label: 'Tarea',   color: 'bg-amber-50 text-amber-600' },
                { href: '/pagos?new=1',   Icon: Receipt,     label: 'Pago',    color: 'bg-pink-50 text-pink-600' },
              ].map(({ href, Icon, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
