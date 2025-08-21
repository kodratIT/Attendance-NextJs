'use client'

import { useEffect, useState, Suspense } from 'react'
import { getSession } from 'next-auth/react'
import CircularProgress from '@mui/material/CircularProgress'
import type { OvertimeRequest, OvertimeListResponse } from '@/types/overtimeTypes'
import OvertimeDashboard from '@views/overtime/OvertimeDashboard'
import axios from 'axios'

const Loading = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <CircularProgress />
  </div>
)

// Fungsi fetch data overtime berdasarkan session
const getOvertimeData = async (session: any): Promise<OvertimeListResponse> => {
  try {
    const role = session?.user?.role?.name
    const userAreaIds: string[] = Array.isArray(session?.user?.areas)
      ? session.user.areas
      : []

    console.log("session data:", session)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) throw new Error('❌ NEXT_PUBLIC_API_URL tidak ditemukan!')

    // Build query parameters
    const params = new URLSearchParams()
    params.set('status', 'all') // Default to show all statuses
    params.set('limit', '100')
    
    console.log('🔍 Fetching overtime data with params:', params.toString())

    // Filter by area if user is Admin role
    if (role === 'Admin' && userAreaIds.length > 0) {
      // For now, we'll use the first area. In production, you might want to handle multiple areas
      params.set('area', userAreaIds[0])
    }

    const res = await axios.get(`${apiUrl}/api/overtime?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      timeout: 10000,
    })

    let overtimeData: OvertimeListResponse = res.data || { data: [], stats: { total: 0, submitted: 0, approved: 0, rejected: 0, totalHours: 0, averageHours: 0 }, total: 0 }

    // Additional filtering if needed based on role
    if (role === 'Admin' && userAreaIds.length > 0) {
      overtimeData.data = overtimeData.data.filter(item => 
        typeof item.areas === 'string' && userAreaIds.includes(item.areas)
      )
    }

    return overtimeData
  } catch (error: any) {
    console.error('❌ Error fetch overtime:', error.message || error)
    return {
      data: [],
      stats: {
        total: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        totalHours: 0,
        averageHours: 0
      },
      total: 0
    }
  }
}

const OvertimeApp = () => {
  const [data, setData] = useState<OvertimeListResponse>({
    data: [],
    stats: {
      total: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      totalHours: 0,
      averageHours: 0
    },
    total: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const session = await getSession()
    if (!session) {
      setLoading(false)
      return
    }

    const overtimeData = await getOvertimeData(session)
    setData(overtimeData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return <Loading />
  
  return (
    <OvertimeDashboard 
      tableData={data.data} 
      stats={data.stats}
      onRefresh={fetchData}
    />
  )
}

const OvertimePage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <OvertimeApp />
    </Suspense>
  )
}

export default OvertimePage
