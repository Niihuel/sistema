"use client"

import { useState } from "react"
import Image from "next/image"
import { Eye, EyeOff, Settings } from "lucide-react"
import DatabaseConfig from "@/components/db-config"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDbConfig, setShowDbConfig] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      })

      let data
      try {
        data = await res.json()
      } catch {
        throw new Error("Error del servidor - respuesta inválida")
      }

      if (!res.ok) throw new Error(data?.error || "Error de autenticación")

      // Forzar una recarga completa para que el middleware detecte el cookie
      window.location.href = "/dashboard"
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative">
      {/* Botón de configuración de BD */}
      <button
        onClick={() => setShowDbConfig(true)}
        className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
        title="Configuración de Base de Datos"
      >
        <Settings className="w-5 h-5 text-white/70" />
      </button>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <Image src="/logo.png" alt="Logo Pretensa & Paschini" width={120} height={120} priority className="object-contain" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Iniciar Sesión</h1>
          <p className="text-white/50 text-sm">Sistema de Interno</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/60 mb-2">Usuario</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 focus:border-white/60 outline-none text-white placeholder-white/40 py-2"
              placeholder="Tu usuario"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 focus:border-white/60 outline-none text-white placeholder-white/40 py-2 pr-10"
                placeholder="Tu contraseña"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-white/60 hover:text-white/80 transition-colors"
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-300 text-xs bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white text-black font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>Ingresando...</span>
              </div>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>

      <DatabaseConfig
        isOpen={showDbConfig}
        onClose={() => setShowDbConfig(false)}
        onSave={() => {
          // Configuración guardada
        }}
      />
    </div>
  )
}
