'use client'

import { format, subDays, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

export default function HeatmapClient({ logsByDate }: { logsByDate: Record<string, number> }) {
  const days = eachDayOfInterval({ start: subDays(new Date(), 89), end: new Date() })
  const max = Math.max(...Object.values(logsByDate), 1)

  function getColor(count: number) {
    if (!count) return 'bg-gray-100'
    const intensity = count / max
    if (intensity < 0.25) return 'bg-teal-100'
    if (intensity < 0.5)  return 'bg-teal-200'
    if (intensity < 0.75) return 'bg-teal-400'
    return 'bg-teal-600'
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {days.map(d => {
          const key = format(d, 'yyyy-MM-dd')
          const count = logsByDate[key] ?? 0
          return (
            <div
              key={key}
              title={`${format(d, 'd MMM', { locale: es })}: ${count} hábito${count !== 1 ? 's' : ''}`}
              className={`w-3 h-3 rounded-sm ${getColor(count)} transition-colors`}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-gray-400">menos</span>
        {['bg-gray-100','bg-teal-100','bg-teal-200','bg-teal-400','bg-teal-600'].map(c => (
          <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[10px] text-gray-400">más</span>
      </div>
    </div>
  )
}
