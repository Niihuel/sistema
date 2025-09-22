"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface MobileTableProps {
  data: Array<Record<string, unknown>>
  columns: Array<{ key: string; label: string; render?: (value: unknown, item: Record<string, unknown>) => ReactNode }>
  loading?: boolean
  emptyMessage?: string
}

export default function MobileTable({ data, columns, loading = false, emptyMessage = "Sin resultados" }: MobileTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
        <div key={i} className="border-b border-white/10 p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <motion.div
          key={item.id as string || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="border-b border-white/10 p-4 hover:bg-white/5 transition-colors"
        >
          <div className="space-y-2">
            {columns.map((col) => {
              const value = item[col.key]
              const displayValue = col.render ? col.render(value, item) : String(value || "-")
              
              return (
                <div key={col.key} className="flex justify-between items-start">
                  <span className="text-sm text-white/70 font-medium min-w-0 flex-shrink-0 mr-3">
                    {col.label}:
                  </span>
                  <span className="text-sm text-white text-right min-w-0 flex-1">
                    {displayValue}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
