"use client"

import type React from "react"
import { useEffect } from "react"

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" style={{ WebkitBackdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="relative w-full max-w-sm sm:max-w-lg lg:max-w-2xl max-h-[90vh] rounded-lg sm:rounded-xl border border-white/10 bg-black/70 text-white shadow-xl p-3 sm:p-4 lg:p-6 animate-in fade-in zoom-in overflow-hidden">
        {title && <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 pr-8">{title}</h3>}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/60 hover:text-white/90 transition-colors"
          aria-label="Cerrar modal"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="space-y-3 overflow-y-auto overflow-x-hidden scrollbar-hide max-h-[calc(90vh-8rem)] touch-pan-y">{children}</div>
        {footer && <div className="mt-3 sm:mt-4 pt-3 border-t border-white/10">{footer}</div>}
      </div>
    </div>
  )
}
