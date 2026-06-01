'use client'

import { useState } from 'react'
import { createTask } from '@/lib/actions/tasks'
import { Plus, X } from 'lucide-react'
import { Task } from '@/types'

export default function NewTaskModal({ autoOpen = false }: { autoOpen?: boolean }) {
  const [open, setOpen] = useState(autoOpen)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', notes: '', status: 'today' as Task['status'],
    priority: 'medium' as Task['priority'], category: 'personal' as Task['category'], due_date: '',
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await createTask({ ...form, notes: form.notes || null, due_date: form.due_date || null })
    setOpen(false)
    setLoading(false)
    setForm({ title:'', notes:'', status:'today', priority:'medium', category:'personal', due_date:'' })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-9 h-9 rounded-xl bg-teal-400 flex items-center justify-center text-white hover:bg-teal-600 transition-colors">
        <Plus className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
  <div className="bg-white rounded-t-2xl md:rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto safe-bottom">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium text-gray-900">Nueva tarea</p>
              <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                placeholder="Título de la tarea" required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Prioridad</label>
                  <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value as Task['priority']}))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value as Task['category']}))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="personal">Personal</option>
                    <option value="finanzas">Finanzas</option>
                    <option value="salud">Salud</option>
                    <option value="trabajo">Trabajo</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Columna inicial</label>
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value as Task['status']}))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="backlog">Backlog</option>
                  <option value="today">Hoy</option>
                  <option value="in_progress">En progreso</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha límite (opcional)</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>

              <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                placeholder="Notas (opcional)" rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />

              <button type="submit" disabled={loading || !form.title}
                className="w-full bg-teal-400 hover:bg-teal-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                {loading ? 'Guardando...' : 'Crear tarea'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
