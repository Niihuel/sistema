"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: "primary" | "ghost"
  small?: boolean
  fancy?: boolean
}

// Gooey-style button inspired by the Login button in the header
export default function Button({ children, variant = "primary", small = false, fancy = false, className = "", ...props }: Props) {
  const size = small ? "h-8 px-4" : "h-9 px-5"
  const styles = variant === "primary"
    ? "bg-white text-black hover:bg-white/90"
    : "bg-white/10 text-white hover:bg-white/20 border border-white/20"

  const textSize = small ? "text-xs" : "text-sm"

  return (
    <button
      {...props}
      className={`relative group inline-flex items-center justify-center rounded-full select-none transition-all duration-300 ${size} ${styles} ${className}`.trim()}
      style={fancy ? { filter: "url(#gooey-filter)" } : undefined}
    >
      <span className={`relative z-10 ${textSize} font-normal leading-none`}>{children}</span>
      {fancy && (
        <>
          {/* Burbuja izquierda permanente */}
          <span aria-hidden className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 transition-transform duration-300 ease-out">
            <span className={`inline-flex items-center justify-center rounded-full ${small ? "w-5 h-5" : "w-6 h-6"} bg-white text-black shadow`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </span>
          </span>
          {/* Flecha "desplegable" a la derecha: invisible hasta hover */}
          <span aria-hidden className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 scale-75 translate-x-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
            <span className={`inline-flex items-center justify-center rounded-full ${small ? "w-5 h-5" : "w-6 h-6"} bg-white text-black shadow`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </span>
          </span>
        </>
      )}
    </button>
  )
}


