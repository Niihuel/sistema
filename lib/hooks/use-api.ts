import useSWR from 'swr'

interface APIConfig {
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  refreshInterval?: number
  dedupingInterval?: number
}

const defaultConfig: APIConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0,
  dedupingInterval: 2000 // 2 segundos para evitar requests duplicados
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    cache: "default",
    headers: {
      'Cache-Control': 'max-age=30'
    }
  })
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }
  return res.json()
}

export function useAPI<T>(url: string, config: APIConfig = {}) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    url,
    fetcher,
    { ...defaultConfig, ...config }
  )

  return {
    data,
    isLoading,
    error,
    refresh: mutate
  }
}

export function useEmployees(filters?: { firstName?: string; lastName?: string; area?: string }) {
  const params = new URLSearchParams()
  if (filters?.firstName) params.set("firstName", filters.firstName)
  if (filters?.lastName) params.set("lastName", filters.lastName)
  if (filters?.area) params.set("area", filters.area)
  
  const url = `/api/employees${params.toString() ? `?${params.toString()}` : ''}`
  return useAPI<{ items: any[] }>(url)
}

export function useInventory(filters?: Record<string, string>) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
  }
  
  const url = `/api/inventory${params.toString() ? `?${params.toString()}` : ''}`
  return useAPI<{ items: any[] }>(url)
}

export function useEquipment(filters?: Record<string, string>) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
  }
  
  const url = `/api/equipment${params.toString() ? `?${params.toString()}` : ''}`
  return useAPI<{ items: any[] }>(url)
}