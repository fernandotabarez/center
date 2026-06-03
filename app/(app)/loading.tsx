export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-5 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="space-y-2">
          <div className="h-6 w-44 bg-gray-200 rounded-lg" />
          <div className="h-4 w-28 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="w-9 h-9 rounded-xl bg-gray-100" />
          <div className="w-9 h-9 rounded-xl bg-gray-100" />
        </div>
      </div>

      {/* Fila de métricas */}
      <div className="bg-white border border-gray-200 rounded-2xl flex items-stretch mb-5 divide-x divide-gray-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3.5">
            <div className="w-5 h-5 rounded bg-gray-200" />
            <div className="h-5 w-8 bg-gray-200 rounded" />
            <div className="h-2.5 w-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Tarjetas */}
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-gray-100" />
                <div className="h-3.5 flex-1 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
