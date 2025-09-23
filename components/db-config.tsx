"use client"

import { useState } from "react"
import Modal from "./modal"
import Button from "./button"
import { useToast } from "@/lib/hooks/use-toast"

interface DatabaseConfig {
  host: string
  port: string
  database: string
  username: string
  password: string
  ssl: boolean
}

interface DatabaseConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (config: DatabaseConfig) => void
  title?: string
}

export default function DatabaseConfig({ isOpen, onClose, onSave, title = "Configuración de Base de Datos" }: DatabaseConfigProps) {
  const [config, setConfig] = useState<DatabaseConfig>({
    host: "192.168.143.163",
    port: "1435",
    database: "sistemas",
    username: "adm",
    password: "123456",
    ssl: false
  })
  
  const [isTesting, setIsTesting] = useState(false)
  const { showSuccess, showError } = useToast()

  async function testConnection() {
    setIsTesting(true)
    try {
      // Enviar configuración al endpoint de prueba
      const response = await fetch('/api/database/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        showSuccess('Conexión exitosa a la base de datos')
      } else {
        showError(result.error || 'Error al conectar con la base de datos')
      }
    } catch (error) {
      showError('Error de red al probar conexión')
    } finally {
      setIsTesting(false)
    }
  }

  function handleSave() {
    if (!config.host || !config.database || !config.username) {
      showError('Por favor completa los campos obligatorios')
      return
    }

    if (onSave) {
      onSave(config)
    }

    showSuccess('Configuración guardada correctamente')
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title={title}
        footer={(
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={onClose} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">
              Cancelar
            </button>
            <button 
              onClick={testConnection} 
              disabled={isTesting}
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {isTesting ? 'Probando...' : 'Probar Conexión'}
            </button>
            <button onClick={handleSave} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base">
              Guardar
            </button>
          </div>
        )}
      >
        <div className="space-y-4">
          {/* Información de conexión */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">
              Información del Servidor
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">
                  Host/IP *
                </label>
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                  placeholder="192.168.143.163"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">
                  Puerto
                </label>
                <input
                  type="text"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                  placeholder="1435"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm text-white/70 mb-1">
                Nombre de Base de Datos *
              </label>
              <input
                type="text"
                value={config.database}
                onChange={(e) => setConfig({ ...config, database: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                placeholder="sistemas_db"
              />
            </div>
          </div>
          
          {/* Credenciales */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">
              Credenciales
            </h3>
            
            <div>
              <label className="block text-xs sm:text-sm text-white/70 mb-1">
                Usuario *
              </label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                placeholder="usuario_db"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm text-white/70 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          {/* Opciones adicionales */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">
              Opciones
            </h3>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ssl"
                checked={config.ssl}
                onChange={(e) => setConfig({ ...config, ssl: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="ssl" className="text-sm text-white/80">
                Usar SSL/TLS
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
