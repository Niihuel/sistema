"use client"

import type { ReactNode } from "react"

interface DarkBackgroundProps {
  children: ReactNode
}

export default function DarkBackground({ children }: DarkBackgroundProps) {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Minimal horizontal lines like FAQ style */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(to right, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '100% 200px, 100% 60px',
          backgroundPosition: '0% 0%, 0% 0%'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
