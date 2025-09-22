import { useEffect, useState } from 'react'

export interface User {
  id: number
  username: string
  role: string
  permissions?: Permission[]
}

export interface Permission {
  id: number
  roleId: number
  resource: string
  level: 'READ' | 'WRITE' | 'ADMIN'
}

export interface AuthState {
  isAuthenticated: boolean | null
  isLoading: boolean
  user: User | null
  permissions: Permission[]
  hasPermission: (resource: string, level?: 'READ' | 'WRITE' | 'ADMIN') => boolean
  hasRole: (roles: string[]) => boolean
  isAdmin: boolean
  refresh: () => Promise<void>
}

export function useAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)
        
        // Fetch user permissions if admin or has specific roles
        if (userData.role === 'ADMIN') {
          try {
            const permissionsResponse = await fetch('/api/roles', {
              credentials: 'include'
            })
            if (permissionsResponse.ok) {
              const rolesData = await permissionsResponse.json()
              const userRole = rolesData.find((r: any) => r.name === userData.role)
              setPermissions(userRole?.permissions || [])
            }
          } catch {
            // If permissions fail, continue with empty permissions
            setPermissions([])
          }
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)
        setPermissions([])
      }
    } catch {
      setIsAuthenticated(false)
      setUser(null)
      setPermissions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const hasPermission = (resource: string, level: 'READ' | 'WRITE' | 'ADMIN' = 'READ') => {
    if (!user) return false
    if (user.role === 'ADMIN') return true // Admin has all permissions
    
    const permissionLevels: Record<string, number> = { 'READ': 1, 'WRITE': 2, 'ADMIN': 3 }
    const requiredLevel = permissionLevels[level.toUpperCase()] || 1
    
    return permissions.some(p => {
      const resourceMatch = p.resource === resource || p.resource === '*'
      const levelMatch = (permissionLevels[p.level.toUpperCase()] || 1) >= requiredLevel
      return resourceMatch && levelMatch
    })
  }

  const hasRole = (roles: string[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const isAdmin = user?.role === 'ADMIN'

  const refresh = async () => {
    setIsLoading(true)
    await fetchUserData()
  }

  return { 
    isAuthenticated, 
    isLoading, 
    user, 
    permissions, 
    hasPermission, 
    hasRole, 
    isAdmin,
    refresh
  }
}