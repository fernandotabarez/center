'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'

type Mode = 'choose' | 'password-signin' | 'password-signup' | 'magic-link' | 'magic-sent'

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>('choose')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(traducirError(error.message))
    else router.push('/dashboard')
    setLoading(false)
  }

  async function handlePasswordSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      setError(traducirError(error.message))
    } else if (data.user && !data.session) {
      setMessage('Revisá tu email para confirmar la cuenta.')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) setError(traducirError(error.message))
    else setMode('magic-sent')
    setLoading(false)
  }

  // Pantalla elección
  if (mode === 'choose') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setMode('password-signin')}
          className="w-full bg-teal-400 hover:bg-teal-600 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4" /> Entrar con contraseña
        </button>
        <button
          onClick={() => setMode('magic-link')}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" /> Magic link por email
        </button>
        <button
          onClick={() => setMode('password-signup')}
          className="w-full text-xs text-gray-500 hover:text-gray-800 py-2 transition-colors"
        >
          ¿No tenés cuenta? Registrate
        </button>
      </div>
    )
  }

  // Magic link enviado
  if (mode === 'magic-sent') {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center">
        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Mail className="w-5 h-5 text-teal-600" />
        </div>
        <p className="font-medium text-teal-900">Revisá tu email</p>
        <p className="text-sm text-teal-700 mt-1">
          Enviamos un link a <strong>{email}</strong>.<br />Un click y entrás.
        </p>
        <button onClick={() => setMode('choose')} className="mt-4 text-xs text-teal-600 underline">
          Volver
        </button>
      </div>
    )
  }

  // Formulario (signin / signup / magic-link)
  const isSignup = mode === 'password-signup'
  const isMagic = mode === 'magic-link'
  const submitFn = isMagic ? handleMagicLink : isSignup ? handlePasswordSignUp : handlePasswordSignIn

  return (
    <form onSubmit={submitFn} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <button
        type="button"
        onClick={() => { setMode('choose'); setError(''); setMessage('') }}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Volver
      </button>

      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
      />

      {!isMagic && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
          {isSignup && <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>}
        </>
      )}

      {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
      {message && <p className="text-teal-600 text-xs mt-3">{message}</p>}

      <button
        type="submit"
        disabled={loading || !email || (!isMagic && !password)}
        className="w-full mt-5 bg-teal-400 hover:bg-teal-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isMagic ? <Mail className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        {loading ? 'Procesando...' : isMagic ? 'Enviar magic link' : isSignup ? 'Crear cuenta' : 'Entrar'}
      </button>
    </form>
  )
}

function traducirError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos'
  if (msg.includes('Email not confirmed')) return 'Tenés que confirmar tu email primero'
  if (msg.includes('User already registered')) return 'Ese email ya está registrado'
  if (msg.includes('rate limit') || msg.includes('Rate')) return 'Demasiados intentos. Esperá un momento.'
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres'
  return msg
}