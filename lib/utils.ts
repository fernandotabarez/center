import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'hoy'
  if (isTomorrow(date)) return 'mañana'
  if (isPast(date)) return `venció ${format(date, 'd MMM', { locale: es })}`
  return format(date, 'd MMM', { locale: es })
}

export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { UYU: '$', USD: 'U$D', EUR: '€' }
  const sym = symbols[currency] ?? currency
  return `${sym} ${amount.toLocaleString('es-UY')}`
}

export function getDueSeverity(dateStr: string): 'overdue' | 'today' | 'tomorrow' | 'soon' | 'ok' {
  const date = parseISO(dateStr)
  if (isPast(date) && !isToday(date)) return 'overdue'
  if (isToday(date)) return 'today'
  if (isTomorrow(date)) return 'tomorrow'
  const diff = (date.getTime() - Date.now()) / 86400000
  if (diff <= 5) return 'soon'
  return 'ok'
}

export const CATEGORY_LABELS: Record<string, string> = {
  personal: 'personal',
  finanzas: 'finanzas',
  salud: 'salud',
  trabajo: 'trabajo',
  otro: 'otro',
}

export const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}

export const CATEGORY_COLORS: Record<string, string> = {
  personal: 'bg-gray-100 text-gray-700',
  finanzas: 'bg-amber-50 text-amber-800',
  salud: 'bg-teal-50 text-teal-800',
  trabajo: 'bg-purple-50 text-purple-800',
  otro: 'bg-gray-100 text-gray-600',
}
