'use client'

import { useAuthErrorMonitor } from '@/lib/hooks/useAuthError'
import { ReactNode } from 'react'

interface AuthMonitorProps {
  children: ReactNode
  checkInterval?: number
  enabled?: boolean
}

export default function AuthMonitor({
  children,
  checkInterval = 60000, // Check every minute
  enabled = true
}: AuthMonitorProps) {
  // Monitor authentication status
  if (enabled) {
    useAuthErrorMonitor(checkInterval)
  }

  return <>{children}</>
}