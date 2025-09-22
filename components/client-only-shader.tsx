"use client"

import { useEffect, useState, Suspense, lazy } from "react"
import dynamic from "next/dynamic"

interface ClientOnlyShaderProps {
  children: React.ReactNode
}

// Use Next.js dynamic import with proper error handling
const ShaderBackground = dynamic(
  () => import("@/components/shader-background").catch((err) => {
    console.error('[ClientOnlyShader] Failed to load shader:', err)
    // Return a fallback component on error
    return {
      default: ({ children }: { children: React.ReactNode }) => (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800/20 via-black/40 to-black"></div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      )
    }
  }),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800/20 via-black/40 to-black"></div>
        <div className="relative z-10">
          <div className="animate-pulse">
            <div className="h-full w-full" />
          </div>
        </div>
      </div>
    )
  }
)

export default function ClientOnlyShader({ children }: ClientOnlyShaderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800/20 via-black/40 to-black"></div>
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800/20 via-black/40 to-black"></div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      }
    >
      <ShaderBackground>
        {children}
      </ShaderBackground>
    </Suspense>
  )
}