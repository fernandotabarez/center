-- Habilitar extensión uuid
create extension if not exists "pgcrypto";

-- Hábitos
create table habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  icon         text not null default '🎯',
  color        text not null default '#1D9E75',
  frequency    text not null check (frequency in ('daily','weekly','monthly')),
  days_of_week int[] not null default '{1,2,3,4,5}',
  notif_time   time,
  archived     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Logs de hábitos
create table habit_logs (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid references habits(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  date       date not null,
  done       boolean not null default true,
  created_at timestamptz not null default now(),
  unique(habit_id, date)
);

-- Tareas
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  notes       text,
  status      text not null default 'backlog' check (status in ('backlog','today','in_progress','done')),
  priority    text not null default 'medium' check (priority in ('high','medium','low')),
  category    text not null default 'personal' check (category in ('personal','finanzas','salud','trabajo','otro')),
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Pagos
create table payments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  name               text not null,
  amount             numeric(12,2) not null,
  currency           text not null default 'UYU' check (currency in ('UYU','USD','EUR')),
  due_date           date not null,
  recurrence         text not null default 'monthly' check (recurrence in ('once','monthly','bimonthly','annual')),
  paid               boolean not null default false,
  paid_at            timestamptz,
  notif_days_before  int not null default 3,
  icon               text not null default '📋',
  created_at         timestamptz not null default now()
);

-- Configuración de usuario
create table user_settings (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  timezone            text not null default 'America/Montevideo',
  currency            text not null default 'UYU',
  theme               text not null default 'system',
  notif_push          boolean not null default false,
  notif_email         boolean not null default false,
  daily_summary_time  time not null default '08:00',
  push_subscription   text
);

-- RLS (Row Level Security) — cada usuario solo ve sus datos
alter table habits       enable row level security;
alter table habit_logs   enable row level security;
alter table tasks        enable row level security;
alter table payments     enable row level security;
alter table user_settings enable row level security;

create policy "habits_own"        on habits        for all using (auth.uid() = user_id);
create policy "habit_logs_own"    on habit_logs    for all using (auth.uid() = user_id);
create policy "tasks_own"         on tasks         for all using (auth.uid() = user_id);
create policy "payments_own"      on payments      for all using (auth.uid() = user_id);
create policy "user_settings_own" on user_settings for all using (auth.uid() = user_id);

-- Índices para performance
create index idx_habit_logs_user_date  on habit_logs(user_id, date);
create index idx_habit_logs_habit_date on habit_logs(habit_id, date);
create index idx_tasks_user_status     on tasks(user_id, status);
create index idx_tasks_due             on tasks(user_id, due_date);
create index idx_payments_user_due     on payments(user_id, due_date);
