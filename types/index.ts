export interface Habit {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  frequency: 'daily' | 'weekly' | 'weekly_flex' | 'monthly'
  days_of_week: number[]
  times_per_week: number
  notif_time: string | null
  archived: boolean
  created_at: string
}

export interface HabitWithStreak extends Habit {
  streak: number
  done_today: boolean
  consistency_30d: number
  week_progress: { done: number; target: number }
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  date: string
  done: boolean
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

export type GoalHorizon = 'short_term' | 'mid_term' | 'long_term'
export type GoalType = 'numeric' | 'milestone'
export type GoalCategory = 'personal' | 'salud' | 'finanzas' | 'carrera' | 'educacion' | 'otro'

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  horizon: GoalHorizon
  goal_type: GoalType
  category: GoalCategory
  icon: string
  target_value: number | null
  current_value: number
  unit: string | null
  due_date: string | null
  completed: boolean
  completed_at: string | null
  archived: boolean
  created_at: string
}

export interface WeeklyObjective {
  id: string
  user_id: string
  week_start: string
  title: string
  goal_id: string | null
  completed: boolean
  completed_at: string | null
  order_index: number
  contributes_amount: number | null
  created_at: string
}

export interface WeeklyObjectiveWithGoal extends WeeklyObjective {
  goal: Goal | null
}