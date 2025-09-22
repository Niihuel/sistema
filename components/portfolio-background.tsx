"use client"

import type { ReactNode } from "react"
import { memo } from "react"

interface PortfolioBackgroundProps {
  children: ReactNode
}

function PortfolioBackground({ children }: PortfolioBackgroundProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default memo(PortfolioBackground)
