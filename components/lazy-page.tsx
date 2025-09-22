"use client"

import { Suspense, lazy, memo } from "react"
import { motion } from "framer-motion"

const LoadingSpinner = memo(function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <motion.div
        className="flex flex-col items-center space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-full border-2 border-white/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-white/70 text-sm">Cargando módulo...</p>
      </motion.div>
    </div>
  )
})

interface LazyPageWrapperProps {
  children: React.ReactNode
}

function LazyPageWrapper({ children }: LazyPageWrapperProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  )
}

export default memo(LazyPageWrapper)

// HOC para crear páginas lazy
export function createLazyPage<T extends Record<string, unknown>>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>
) {
  const LazyComponent = lazy(importFn)
  
  return memo(function LazyPage(props: T) {
    return (
      <LazyPageWrapper>
        <LazyComponent {...props} />
      </LazyPageWrapper>
    )
  })
}