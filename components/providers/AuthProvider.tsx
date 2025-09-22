'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  username: string
  role: string
  email?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  // Legacy compatibility methods
  isAdmin: boolean
  isSuperAdmin: boolean
  hasRole: (roles: string | string[]) => boolean
  hasPermission: (resource: string, action: string) => boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Computed values
  const isAuthenticated = !!user
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  // Legacy methods
  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false
    // Simplified permission check - admins have all permissions
    if (isAdmin) return true
    // Add more complex logic here if needed
    return false
  }

  // Fetch user data
  const fetchUser = async () => {
    try {
      setError(null)
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const text = await response.text()
        if (text) {
          try {
            const userData = JSON.parse(text)
            setUser(userData)
          } catch (err) {
            console.warn('Invalid JSON response:', text)
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } else if (response.status === 401) {
        setUser(null)
      } else {
        setError('Failed to fetch user data')
      }
    } catch (err) {
      console.warn('Auth fetch error:', err)
      setUser(null)
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  // Login method
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        await fetchUser()
        return true
      } else {
        try {
          const text = await response.text()
          if (text) {
            const data = JSON.parse(text)
            setError(data.error || 'Login failed')
          } else {
            setError('Login failed - empty response')
          }
        } catch (err) {
          setError('Login failed - invalid response')
        }
        return false
      }
    } catch (err) {
      setError('Login error')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Logout method
  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      console.warn('Logout error:', err)
    } finally {
      setUser(null)
    }
  }

  // Refresh method
  const refresh = async (): Promise<void> => {
    await fetchUser()
  }

  // Initial load
  useEffect(() => {
    fetchUser()
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isSuperAdmin,
    hasRole,
    hasPermission,
    login,
    logout,
    refresh
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}