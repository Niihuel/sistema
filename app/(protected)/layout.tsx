'use client'

import type React from "react"
import Header from "@/components/header"
import PortfolioBackground from "@/components/portfolio-background"
import SWRProvider from "@/components/swr-provider"
import AuthGuard from "@/components/AuthGuard"
import AuthMonitor from "@/components/auth-monitor"
import ErrorBoundary from "@/components/error-boundary"
import { ToastProvider } from "@/lib/hooks/use-toast"
import PWAInstallPrompt from "@/components/pwa-install-prompt"
import PWABrowserBar from "@/components/pwa-browser-bar"

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <AuthMonitor>
          <SWRProvider>
            <ToastProvider>
              <PortfolioBackground>
                <PWABrowserBar />
                <Header />
                <PWAInstallPrompt />
                <main className="pt-16 md:pt-20">
                  <div
                    className="px-4 sm:px-6 pt-6 pb-10 mx-auto w-full max-w-[1400px]"
                    style={{
                      paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
                      paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))'
                    }}
                  >
                    {children}
                  </div>
                </main>
              </PortfolioBackground>
            </ToastProvider>
          </SWRProvider>
        </AuthMonitor>
      </AuthGuard>
    </ErrorBoundary>
  )
}