"use client"

import { useEffect, useState, useRef } from "react"
import type { ReactNode } from "react"

interface AdaptiveTransparencyProps {
  children: ReactNode
  className?: string
}

export default function AdaptiveTransparency({ children, className = "" }: AdaptiveTransparencyProps) {
  const [lightness, setLightness] = useState(0.5)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Create a canvas to sample the background color
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1
    canvas.height = 1

    const checkLightness = () => {
      try {
        // Get computed background color from body
        const bodyStyle = getComputedStyle(document.body)
        const backgroundColor = bodyStyle.backgroundColor

        if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
          // Parse RGB values from background-color
          const rgbMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
          if (rgbMatch) {
            const [, r, g, b] = rgbMatch
            // Calculate relative luminance
            const luminance = (0.299 * parseInt(r) + 0.587 * parseInt(g) + 0.114 * parseInt(b)) / 255
            setLightness(luminance)
            return
          }
        }

        // Fallback: use computed background color
        ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#000000'
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data

        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        setLightness(luminance)
      } catch {
        // Fallback if sampling fails
        setLightness(0.3)
      }
    }

    // Check lightness periodically to adapt to shader changes
    const interval = setInterval(checkLightness, 100)
    checkLightness()

    return () => clearInterval(interval)
  }, [])

  // Calculate transparency based on background lightness
  const backgroundOpacity = lightness > 0.5 ? 0.15 : 0.05 // More opaque on light backgrounds
  const borderOpacity = lightness > 0.5 ? 0.2 : 0.1 // Stronger border on light backgrounds

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        backgroundColor: `rgba(255, 255, 255, ${backgroundOpacity})`,
        borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
      }}
    >
      {children}
    </div>
  )
}