'use client'

import { useState, useTransition } from 'react'
import { Payment } from '@/types'
import { markPaymentPaid, createPayment, deletePayment } from '@/lib/actions/payments'
import { formatCurrency, formatDate, getDueSeverity } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Check, Plus, X, Trash2 } from 'lucide-react'

const dueBadge: Record<string, string> = {
  overdue: 'text-red-600 font-medium', today: 'text-red-500 font-medium',
  tomorrow: 'text-amber-600', soon: 'text-amber-500', ok: 'text-gray-400',
}

const ICONS: Record<string, string> = { ute:'⚡', antel:'📡', internet:'🌐', alquiler:'🏠', tarjeta:'💳', visa:'💳', gym:'🏋️', otro:'📋' }
function getIcon(name: string) {
  const k = Object.keys(ICONS).find(k => name.toLowerCase().includes(k))
  return k ? ICONS[k] : '📋'
}

const emptyForm = { name:'', amount:'', currency:'UYU' as Payment['currency'], due_date:'', recurrence:'monthly' as Payment['recurrence'], notif_days_before:3, icon:'📋' }

export default function PaymentsClient({ initialPayments, autoOpen }: { initialPayments: Payment[], autoOpen?: boolean }) {
  const [payments, setPayments] = useState(initialPayments)
  const [showModal, setShowModal] = useState(autoOpen ?? false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [pending, startTransition] = useTransition()

  function pay(p: Payment) {
    setPayments(prev => prev.map(x => x.id === p.id ? { ...x, paid: true } : x))
    startTransition(() => markPaymentPaid(p.id, p.recurrence))
  }

  function remove(id: string) {
    setPayments(prev => prev.filter(p => p.id !== id))
    startTransition(() => deletePayment(id))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await createPayment({ ...form, amount: Number(form.amount), icon: getIcon(form.name) })
    setShowModal(false)
    setForm(emptyForm)
    setLoading(false)
  }

  const pending_ = payments.filter(p => !p.paid)
  const paid = payments.filter(p => p.paid)

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-teal-400 hover:bg-teal-600 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Nuevo pago
        </button>
      </div>

      {pending_.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">pendientes</p>
          <div className="space-y-2">
            {pending_.map(p => {
              const sev = getDueSeverity(p.due_date)
              return (
                <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-3.5 flex items-center gap-3">
                  <span className="text-xl">{getIcon(p.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.recurrence === 'monthly' ? 'mensual' : p.recurrence}</p>
                  </div>
                  <div className="text-right mr-2">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(p.amount, p.currency)}</p>
                    <p className={cn('text-xs', dueBadge[sev])}>{formatDate(p.due_date)}</p>
                  </div>
                  <button onClick={() => pay(p)} className="w-8 h-8 rounded-full bg-teal-50 hover:bg-teal-400 hover:text-white text-teal-600 flex items-center justify-center transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(p.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {paid.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">pagados</p>
          <div className="space-y-2">
            {paid.slice(0, 5).map(p => (
              <div key={p.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 flex items-center gap-3 opacity-60">
                <span className="text-xl">{getIcon(p.name)}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 line-through">{p.name}</p>
                </div>
                <p className="text-sm text-gray-500">{formatCurrency(p.amount, p.currency)}</p>
                <Check className="w-4 h-4 text-teal-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium">Nuevo pago</p>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="ej. UTE, ANTEL, Alquiler" required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))}
                  placeholder="Monto" required min={0}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                <select value={form.currency} onChange={e => setForm(f => ({...f, currency: e.target.value as Payment['currency']}))}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option>UYU</option><option>USD</option><option>EUR</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha de vencimiento</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Recurrencia</label>
                <select value={form.recurrence} onChange={e => setForm(f => ({...f, recurrence: e.target.value as Payment['recurrence']}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="once">Única vez</option>
                  <option value="monthly">Mensual</option>
                  <option value="bimonthly">Bimestral</option>
                  <option value="annual">Anual</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Avisar con N días de anticipación</label>
                <input type="number" value={form.notif_days_before} min={1} max={30}
                  onChange={e => setForm(f => ({...f, notif_days_before: Number(e.target.value)}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-teal-400 hover:bg-teal-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                {loading ? 'Guardando...' : 'Agregar pago'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
