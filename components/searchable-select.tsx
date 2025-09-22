"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type Option = { value: string; label: string }

type SearchableSelectProps = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  disabled?: boolean
  searchPlaceholder?: string
}

export default function SearchableSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Seleccionar...", 
  className = "", 
  disabled,
  searchPlaceholder = "Buscar..."
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  const selected = useMemo(() => options.find(o => o.value === value) || null, [options, value])
  
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    return options.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

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

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open])

  function toggle() {
    if (disabled) return
    setOpen(o => !o)
    setSearchTerm("")
    setActiveIndex(-1)
    
    // Prevent mobile keyboard from opening when just opening dropdown
    if (searchRef.current) {
      searchRef.current.blur()
    }
  }

  function selectOption(option: Option) {
    onChange(option.value)
    setOpen(false)
    setSearchTerm("")
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(i => Math.min(filteredOptions.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(i => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const opt = filteredOptions[activeIndex]
      if (opt) {
        selectOption(opt)
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
          className="absolute z-50 w-full mt-1 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl max-h-60 overflow-hidden"
          style={{ WebkitBackdropFilter: 'blur(4px)' }}
          role="listbox"
        >
          <div className="p-2 border-b border-white/10">
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 text-sm bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              inputMode="none"
              autoComplete="off"
              onFocus={(e) => {
                // Delay focus to prevent mobile keyboard from opening immediately
                setTimeout(() => {
                  e.target.setAttribute('inputMode', 'text')
                }, 100)
              }}
            />
          </div>
          <div className="overflow-y-auto scrollbar-hide max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/50">No se encontraron resultados</div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => selectOption(option)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors duration-150 ${
                    option.value === value
                      ? "bg-white/20 text-white"
                      : index === activeIndex
                      ? "bg-white/10 text-white"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
