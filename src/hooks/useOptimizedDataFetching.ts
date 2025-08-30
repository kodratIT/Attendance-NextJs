import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getSession } from 'next-auth/react'
import axios from 'axios'
import type { AttendanceRowType } from '@/types/attendanceRowTypes'
import type { AreaType } from '@/types/areaTypes'

interface UseOptimizedDataFetchingReturn {
  data: AttendanceRowType[]
  areaData: AreaType[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  statistics: {
    totalEmployees: number
    presentCount: number
    lateCount: number
    absentCount: number
    attendanceRate: string
    lateRate: string
  }
}

// Simple cache implementation
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key)
    return null
  }
  
  return cached.data
}

const setCachedData = (key: string, data: any, ttl: number) => {
  cache.set(key, { data, timestamp: Date.now(), ttl })
}

export const useOptimizedDataFetching = (): UseOptimizedDataFetchingReturn => {
  const [data, setData] = useState<AttendanceRowType[]>([])
  const [areaData, setAreaData] = useState<AreaType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employeeCount, setEmployeeCount] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Statistics calculation with memoization
  const statistics = useMemo(() => {
    const presentCount = data.filter(item => item.status === 'present').length
    const lateCount = data.filter(item => item.status === 'late').length
    const absentCount = data.filter(item => item.status === 'absent').length
    const totalEmployees = employeeCount || data.length
    
    const attendanceRate = totalEmployees > 0 
      ? ((presentCount + lateCount) / totalEmployees * 100).toFixed(1) 
      : '0'
    const lateRate = totalEmployees > 0 
      ? (lateCount / totalEmployees * 100).toFixed(1) 
      : '0'
    
    return {
      totalEmployees,
      presentCount,
      lateCount,
      absentCount,
      attendanceRate,
      lateRate
    }
  }, [data, employeeCount])

  const fetchData = useCallback(async (useCache = true) => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      setLoading(true)
      setError(null)

      // Check session
      const session = await getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const role = session?.user?.role?.name
      const userAreaIds: string[] = Array.isArray(session?.user?.areas) ? session.user.areas : []
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

      // Get today's date for cache key
      const now = new Date()
      now.setHours(now.getHours() + 7)
      const fromDate = now.toISOString().slice(0, 10)
      const cacheKey = `attendance_${fromDate}_${role}_${userAreaIds.join(',')}`

      // Check cache first
      if (useCache) {
        const cachedResult = getCachedData(cacheKey)
        if (cachedResult) {
          console.log('📦 Using cached data')
          setData(cachedResult.attendanceData)
          setAreaData(cachedResult.areaData) 
          setEmployeeCount(cachedResult.employeeCount)
          setLoading(false)
          return
        }
      }

      console.log('🌐 Fetching fresh data...')

      // Fetch only essential data first
      const areasRes = await axios.get(`${apiUrl}/api/areas`, {
        signal: abortControllerRef.current.signal,
        timeout: 5000,
      })
      const areas = areasRes.data?.data || []
      setAreaData(areas)

      // Fetch attendance data with smaller timeout
      const attendanceRes = await axios.get(
        `${apiUrl}/api/attendance?fromDate=${fromDate}&toDate=${fromDate}&limit=100`,
        {
          signal: abortControllerRef.current.signal,
          timeout: 8000,
          headers: {
            'Cache-Control': 'max-age=120', // 2 minute cache
          },
        }
      )

      let attendanceData: AttendanceRowType[] = attendanceRes.data || []

      // Apply role-based filtering
      if (role === 'Admin' && userAreaIds.length > 0) {
        attendanceData = attendanceData.filter((row: AttendanceRowType) => 
          typeof row?.areaId === 'string' && userAreaIds.includes(row.areaId)
        )
      }

      // Get user count from attendance data instead of separate API call
      const employeeCount = attendanceData.length

      // Cache the result
      setCachedData(cacheKey, {
        attendanceData,
        areaData: areas,
        employeeCount
      }, 120000) // 2 minutes cache

      setData(attendanceData)
      setEmployeeCount(employeeCount)

      console.log('✅ Data loaded successfully')

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 Request aborted')
        return
      }
      
      console.error('❌ Error fetching data:', error)
      setError(error.message || 'Failed to load data')
      
      // Set empty state on error
      setData([])
      setEmployeeCount(0)
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [])

  const refetch = useCallback(() => {
    return fetchData(false) // Force fresh data
  }, [fetchData])

  useEffect(() => {
    fetchData(true) // Initial load with cache

    // Setup auto-refresh every 10 minutes (even less frequent)
    const interval = setInterval(() => {
      fetchData(true)
    }, 600000) // 10 minutes

    return () => {
      clearInterval(interval)
      // Clean up abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  return {
    data,
    areaData,
    loading,
    error,
    refetch,
    statistics
  }
}
