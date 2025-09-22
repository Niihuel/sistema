"use client"

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone)
    }

    // Check if iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      const ios = /iphone|ipad|ipod/.test(userAgent)
      setIsIOS(ios)
    }

    checkStandalone()
    checkIOS()

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)

      // Show prompt after a delay if not already installed
      if (!localStorage.getItem('pwa-install-dismissed')) {
        setTimeout(() => {
          setShowPrompt(true)
        }, 2000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setShowPrompt(false)
      setInstallPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return

    // Show the install prompt
    installPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    setInstallPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if already installed or dismissed
  if (isStandalone || !showPrompt) return null

  // iOS specific prompt
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
        <div className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl animate-fade-in" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Instalar Sistema IT</h3>
              <p className="text-white/70 text-sm mb-3">
                Para instalar: pulsa el botón compartir <span className="inline-block px-1">⬆️</span> y luego &quot;Añadir a pantalla de inicio&quot;
              </p>
              <button
                onClick={handleDismiss}
                className="text-white/50 text-xs hover:text-white/70 transition-colors"
              >
                No volver a mostrar
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Android/Chrome prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl animate-fade-in" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">Instalar Sistema IT</h3>
            <p className="text-white/70 text-sm mb-3">
              Instala la app para acceso rápido y uso sin conexión
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/20 transition-colors"
              >
                Ahora no
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>
    </div>
  )
}