'use client'

interface ChartData {
  name: string
  value: number
  color?: string
}

interface ChartCardProps {
  title: string
  data: ChartData[]
  type?: 'bar' | 'pie' | 'line'
  showLegend?: boolean
  className?: string
}

export function ChartCard({ 
  title, 
  data = [], 
  type = 'bar',
  showLegend = true,
  className = ''
}: ChartCardProps) {
  const getColor = (item: ChartData, index: number) => {
    if (item.color) return item.color
    
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-gray-500'
    ]
    
    return colors[index % colors.length]
  }
  
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const total = data.reduce((sum, d) => sum + d.value, 0)
  
  if (type === 'pie') {
    // Crear un gráfico de tipo donut simple
    let cumulativePercent = 0
    
    return (
      <div className={`rounded-xl border border-white/10 bg-white/5 p-4 ${className}`}>
        <p className="text-sm text-white/70 mb-4">{title}</p>
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              {data.map((item, index) => {
                const percent = (item.value / total) * 100
                const strokeDasharray = `${percent} ${100 - percent}`
                const strokeDashoffset = -cumulativePercent
                cumulativePercent += percent
                
                return (
                  <circle
                    key={index}
                    cx="64"
                    cy="64"
                    r="48"
                    stroke={getColor(item, index).replace('bg-', '')}
                    strokeWidth="24"
                    fill="none"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className={getColor(item, index).replace('bg-', 'stroke-')}
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-xs text-white/60">Total</p>
              </div>
            </div>
          </div>
        </div>
        {showLegend && (
          <div className="mt-4 space-y-1">
            {data.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getColor(item, index)}`} />
                  <span className="text-white/70">{item.name}</span>
                </div>
                <span className="text-white/90">{item.value}</span>
              </div>
            ))}
            {data.length > 4 && (
              <p className="text-xs text-white/50">+{data.length - 4} más</p>
            )}
          </div>
        )}
      </div>
    )
  }
  
  // Gráfico de barras por defecto
  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-4 ${className}`}>
      <p className="text-sm text-white/70 mb-3">{title}</p>
      <div className="space-y-2">
        {data.length === 0 && (
          <p className="text-white/50 text-xs">Sin datos</p>
        )}
        {data.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {showLegend && (
              <div className="flex items-center gap-1 min-w-[80px]">
                <div className={`w-2 h-2 rounded-full ${getColor(item, index)} flex-shrink-0`} />
                <span className="text-xs text-white/70 truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
            )}
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                className={`h-full ${getColor(item, index)} transition-all duration-500`} 
                style={{ width: `${(item.value / maxValue) * 100}%` }} 
              />
            </div>
            <span className="w-8 text-right text-xs text-white/80">{item.value}</span>
          </div>
        ))}
        {data.length > 5 && (
          <p className="text-xs text-white/50 mt-1">+{data.length - 5} más</p>
        )}
      </div>
    </div>
  )
}