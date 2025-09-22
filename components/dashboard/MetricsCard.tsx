'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricsCardProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: {
    value: number
    type: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
  className?: string
}

export function MetricsCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon,
  className = ''
}: MetricsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend.type) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }
  
  const getTrendColor = () => {
    if (!trend) return ''
    
    switch (trend.type) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }
  
  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/60 text-sm mb-1">{title}</p>
          <p className="text-4xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-white/50 text-xs mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon()}
              <span className={`text-sm ${getTrendColor()}`}>
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}