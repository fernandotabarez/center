# Mi Centro — Command Center Personal

PWA mobile-first para gestionar hábitos, tareas y pagos. Deploy en Vercel + Supabase, 100% gratuito.

---

## Stack

| Capa | Tecnología | Plan gratuito |
|------|-----------|---------------|
| Frontend + API | Next.js 15 (App Router) | — |
| Deploy | Vercel | Hobby (gratis) |
| Base de datos + Auth | Supabase | 500 MB, 50k usuarios |
| Notificaciones push | Web Push API + Service Worker | Gratis (nativo) |
| Email resumen | Resend | 3.000 emails/mes |
| Cron diario | Vercel Cron Jobs | 2 jobs gratis |

---

## Deploy paso a paso

### 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → **New project**
2. Elegir nombre, contraseña y región (seleccioná **South America (São Paulo)** para menor latencia)
3. Esperar que el proyecto levante (~2 min)
4. Ir a **Settings → API** y copiar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Ejecutar el schema SQL

1. En Supabase ir a **SQL Editor → New query**
2. Pegar el contenido de `supabase/migrations/001_initial.sql`
3. Click en **Run** — debería decir "Success"

### 3. Configurar Auth en Supabase

1. Ir a **Authentication → URL Configuration**
2. En **Site URL** poner: `https://tu-app.vercel.app`
3. En **Redirect URLs** agregar: `https://tu-app.vercel.app/auth/callback`

### 4. Generar claves VAPID para Push

En tu máquina local (necesitás Node.js):

```bash
npx web-push generate-vapid-keys
```

Guardá los valores:
- `Public Key` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `Private Key` → `VAPID_PRIVATE_KEY`

### 5. Crear cuenta en Resend (email)

1. Ir a [resend.com](https://resend.com) → crear cuenta gratis
2. **API Keys → Create API Key**
3. Copiar la key → `RESEND_API_KEY`
4. **Opcional pero recomendado**: verificar tu dominio en Resend para que los emails no vayan a spam.
   Si no tenés dominio, podés usar `onboarding@resend.dev` como remitente (solo para desarrollo).

### 6. Subir código a GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/tu-usuario/micentro.git
git push -u origin main
```

### 7. Deploy en Vercel

1. Ir a [vercel.com](https://vercel.com) → **Add New Project**
2. Importar tu repositorio de GitHub
3. Framework: **Next.js** (auto-detectado)
4. Antes de hacer click en Deploy, ir a **Environment Variables** y agregar todas estas:

```
NEXT_PUBLIC_SUPABASE_URL          = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJ...
SUPABASE_SERVICE_ROLE_KEY         = eyJ...
NEXT_PUBLIC_VAPID_PUBLIC_KEY      = BAAAAx...
VAPID_PRIVATE_KEY                 = xxxx...
VAPID_EMAIL                       = tu@email.com
RESEND_API_KEY                    = re_xxx...
CRON_SECRET                       = cualquier-string-secreto-largo
NEXT_PUBLIC_APP_URL               = https://tu-app.vercel.app
```

5. Click en **Deploy** → esperar ~2 min

### 8. Actualizar URLs tras el deploy

Una vez que Vercel te dé la URL final (ej. `micentro.vercel.app`):

1. En Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://micentro.vercel.app`
   - Redirect URL: `https://micentro.vercel.app/auth/callback`

2. En Vercel → **Settings → Environment Variables**:
   - Actualizar `NEXT_PUBLIC_APP_URL` con la URL real
   - Hacer **Redeploy** para que tome el cambio

### 9. Instalar como PWA (móvil)

**Android (Chrome):**
- Abrir la app en Chrome
- Menú ⋮ → "Agregar a pantalla de inicio"

**iPhone (Safari):**
- Abrir en Safari
- Botón compartir → "Agregar a pantalla de inicio"

---

## Desarrollo local

```bash
# Clonar e instalar
git clone https://github.com/tu-usuario/micentro.git
cd micentro
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores reales

# Correr en desarrollo
npm run dev
# → http://localhost:3000
```

---

## Estructura del proyecto

```
micentro/
├── app/
│   ├── (auth)/login/          # Pantalla de login (magic link)
│   ├── (app)/
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── habitos/           # Gestión de hábitos
│   │   ├── tareas/            # Kanban de tareas
│   │   ├── pagos/             # Vencimientos y pagos
│   │   ├── estadisticas/      # Heatmap y métricas
│   │   └── ajustes/           # Config + notificaciones
│   ├── api/cron/              # Cron job resumen diario
│   └── auth/callback/         # Callback OAuth Supabase
├── components/
│   ├── layout/                # AppShell (sidebar + bottom nav)
│   ├── dashboard/             # Widgets del dashboard
│   ├── habitos/               # Cards y modales de hábitos
│   ├── tareas/                # Kanban board
│   ├── pagos/                 # Lista de pagos
│   ├── estadisticas/          # Heatmap
│   └── ajustes/               # Settings y notificaciones
├── lib/
│   ├── supabase/              # Clients (server, browser, middleware)
│   ├── actions/               # Server Actions (habits, tasks, payments, settings)
│   ├── push.ts                # Web Push helper
│   └── utils.ts               # Utilidades compartidas
├── public/
│   ├── sw.js                  # Service Worker (push notifications)
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # Íconos PWA 192 y 512px
├── supabase/migrations/
│   └── 001_initial.sql        # Schema completo + RLS
├── types/index.ts             # Tipos TypeScript compartidos
└── vercel.json                # Cron job config (8am UTC-3 = 11am UTC)
```

---

## Schema de base de datos

```
habits          → id, user_id, name, icon, color, frequency, days_of_week, notif_time, archived
habit_logs      → id, habit_id, user_id, date, done  [unique: habit_id+date]
tasks           → id, user_id, title, notes, status, priority, category, due_date
payments        → id, user_id, name, amount, currency, due_date, recurrence, paid, notif_days_before
user_settings   → user_id, timezone, currency, theme, notif_push, notif_email, daily_summary_time, push_subscription
```

Todas las tablas tienen **Row Level Security (RLS)** habilitado. Cada usuario solo puede leer y escribir sus propios datos.

---

## Cron job — resumen diario

El archivo `vercel.json` configura el cron para correr a las **11:00 UTC** (08:00 Montevideo, UTC-3).

Si estás en otro huso horario, ajustá el schedule:
```json
"schedule": "0 11 * * *"   ← UTC, equivale a 8am Montevideo
"schedule": "0 12 * * *"   ← UTC, equivale a 9am Montevideo
```

---

## Solución de problemas frecuentes

**El magic link no llega**
- Revisá spam
- Verificá que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén bien en Vercel
- En Supabase → Authentication → Logs para ver si el email se envió

**Las notificaciones push no llegan**
- Las VAPID keys deben generarse una sola vez y no cambiar
- En iOS, el soporte push requiere Safari y que la app esté instalada como PWA (Agregar a pantalla de inicio)
- Verificá que `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en Vercel sea exactamente igual al generado

**Error de CORS o redirect**
- Verificar que la URL en Supabase Auth → Site URL coincida exactamente con la URL de Vercel
- Incluir `https://` y sin trailing slash

**El cron no dispara**
- El plan Hobby de Vercel incluye cron jobs pero con limitaciones
- Verificar en Vercel → Dashboard → Cron Jobs que esté listado
- El endpoint requiere el header `Authorization: Bearer {CRON_SECRET}`
