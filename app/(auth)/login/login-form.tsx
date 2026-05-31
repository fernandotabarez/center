'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2 } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })

    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center">
        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Mail className="w-5 h-5 text-teal-600" />
        </div>
        <p className="font-medium text-teal-900">Revisá tu email</p>
        <p className="text-sm text-teal-700 mt-1">
          Enviamos un link a <strong>{email}</strong>.<br />Un click y entrás.
        </p>
        <button onClick={() => setSent(false)} className="mt-4 text-xs text-teal-600 underline">
          Usar otro email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
      />
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      <button
        type="submit"
        disabled={loading || !email}
        className="w-full mt-4 bg-teal-400 hover:bg-teal-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {loading ? 'Enviando...' : 'Enviar magic link'}
      </button>
      <p className="text-xs text-gray-400 text-center mt-3">Sin contraseña. Solo tu email.</p>
    </form>
  )
}
