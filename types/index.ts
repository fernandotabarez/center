export interface Habit {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  frequency: 'daily' | 'weekly' | 'monthly'
  days_of_week: number[]
  notif_time: string | null
  archived: boolean
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  date: string
  done: boolean
}

export interface HabitWithStreak extends Habit {
  streak: number
  done_today: boolean
  consistency_30d: number
}

export interface Task {
  id: string
  user_id: string
  title: string
  notes: string | null
  status: 'backlog' | 'today' | 'in_progress' | 'done'
  priority: 'high' | 'medium' | 'low'
  category: 'personal' | 'finanzas' | 'salud' | 'trabajo' | 'otro'
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  name: string
  amount: number
  currency: 'UYU' | 'USD' | 'EUR'
  due_date: string
  recurrence: 'once' | 'monthly' | 'bimonthly' | 'annual'
  paid: boolean
  paid_at: string | null
  notif_days_before: number
  icon: string
  created_at: string
}

export interface UserSettings {
  user_id: string
  timezone: string
  currency: 'UYU' | 'USD' | 'EUR'
  theme: 'light' | 'dark' | 'system'
  notif_push: boolean
  notif_email: boolean
  daily_summary_time: string
  push_subscription: string | null
}

export interface DashboardStats {
  habits_done_today: number
  habits_total_today: number
  streak: number
  consistency_30d: number
  urgent_tasks: number
  upcoming_payments: Payment[]
}
