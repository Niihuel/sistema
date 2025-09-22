"use client"

import { useEffect, useState } from "react"

export default function PWABrowserBar() {
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    // Check if running in PWA mode
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          ('standalone' in window.navigator) ||
                          document.referrer.includes('android-app://')
      setIsPWA(isStandalone)
    }

    checkPWA()
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addListener(checkPWA)

    return () => mediaQuery.removeListener(checkPWA)
  }, [])

  // Only show in PWA standalone mode
  if (!isPWA) return null

  return (
    <div className="pwa-browser-bar fixed top-0 left-0 right-0 z-60 h-11 bg-gradient-to-b from-black/80 to-black/40 backdrop-blur-xl border-b border-white/10" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
      <div className="flex items-center justify-center h-full px-4">
        {/* Simulated browser URL bar */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="bg-black/30 rounded-full px-4 py-1.5 text-center">
            <span className="text-white/60 text-xs font-medium">
              Sistema Interno IT
            </span>
          </div>
        </div>
        
        {/* Connection indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}