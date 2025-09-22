"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type Option = { value: string; label: string }

type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

// Accessible custom select with keyboard navigation and styled dropdown
export default function Select({ value, onChange, options, placeholder = "Seleccionar...", className = "", disabled }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(() => options.find(o => o.value === value) || null, [options, value])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onEsc)
    }
  }, [open])

  function toggle() {
    if (disabled) return
    setOpen(o => !o)
    setActiveIndex(() => Math.max(0, options.findIndex(o => o.value === value)))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        setOpen(true)
        setActiveIndex(() => Math.max(0, options.findIndex(o => o.value === value)))
      }
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(i => Math.min(options.length - 1, (i < 0 ? 0 : i + 1)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(i => Math.max(0, (i < 0 ? 0 : i - 1)))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const opt = options[activeIndex]
      if (opt) {
        onChange(opt.value)
        setOpen(false)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className={`relative ${disabled ? 'opacity-60' : ''}`} onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        className={`w-full text-left px-3 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white text-sm transition-all duration-200 outline-none ${className}`}
        style={{ WebkitBackdropFilter: 'blur(4px)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={selected ? "text-white" : "text-white/50"}>
            {selected ? selected.label : placeholder}
          </span>
          <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 mt-1 z-50 rounded-lg border border-white/10 bg-black/80 backdrop-blur-md shadow-xl overflow-hidden"
          style={{ WebkitBackdropFilter: 'blur(12px)' }}
        >
          <div className="max-h-64 overflow-y-auto scrollbar-hide">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/60">Sin opciones</div>
            ) : (
              options.map((opt, idx) => {
                const selectedOpt = value === opt.value
                const active = idx === activeIndex
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={selectedOpt}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      active ? 'bg-white/15' : 'hover:bg-white/10'
                    } ${selectedOpt ? 'text-white' : 'text-white/80'}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                  >
                    {opt.label}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}


